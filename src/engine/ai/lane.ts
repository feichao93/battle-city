import { BLOCK_SIZE, FIELD_SIZE, ITEM_SIZE_MAP, TANK_SIZE } from '../constants'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import { getDirectionInfo, testCollide, type Rect } from '../physics/geometry'
import type { Direction, Point } from '../types'

export type LaneHitKind = 'bot' | 'player' | 'eagle' | 'steel' | 'edge'

export interface LaneScan {
  /** 第一个挡住子弹的东西；distance 从炮口所在的坦克边缘算起 */
  hit: { kind: LaneHitKind; distance: number }
  /** 到 hit 之前要打穿的砖（按 4px 一层计） */
  bricks: number
}

/** 队友和老鹰按加宽的通道判断，宁可少开一枪 */
const FRIENDLY_MARGIN = 2
/** 子弹宽 3px，从坦克边的 6px 处射出（见 fire.ts bulletStartPosition） */
export const BULLET_OFFSET = 6
export const BULLET_WIDTH = 3
const EPS = 0.01

/** 炮口前方 [from, to] 这一段、横向加宽 margin 的子弹通道 */
function laneRect(
  pos: Point,
  direction: Direction,
  from: number,
  to: number,
  margin: number,
): Rect {
  const across = BULLET_OFFSET - margin
  const width = BULLET_WIDTH + 2 * margin
  const length = to - from - 2 * EPS
  switch (direction) {
    case 'up':
      return { x: pos.x + across, y: pos.y - to + EPS, width, height: length }
    case 'down':
      return { x: pos.x + across, y: pos.y + TANK_SIZE + from + EPS, width, height: length }
    case 'left':
      return { x: pos.x - to + EPS, y: pos.y + across, width: length, height: width }
    case 'right':
      return { x: pos.x + TANK_SIZE + from + EPS, y: pos.y + across, width: length, height: width }
  }
}

function distanceTo(pos: Point, direction: Direction, rect: Rect): number {
  switch (direction) {
    case 'up':
      return pos.y - (rect.y + rect.height)
    case 'down':
      return rect.y - (pos.y + TANK_SIZE)
    case 'left':
      return pos.x - (rect.x + rect.width)
    case 'right':
      return rect.x - (pos.x + TANK_SIZE)
  }
}

function edgeDistance(pos: Point, direction: Direction): number {
  switch (direction) {
    case 'up':
      return pos.y
    case 'down':
      return FIELD_SIZE - pos.y - TANK_SIZE
    case 'left':
      return pos.x
    case 'right':
      return FIELD_SIZE - pos.x - TANK_SIZE
  }
}

/** 老鹰外面一圈 8px 的砖墙，打穿了老鹰就暴露了 */
export function eagleGuard(map: TerrainMap): Rect | null {
  if (map.eagle == null) {
    return null
  }
  const ring = BLOCK_SIZE / 2
  return {
    x: map.eagle.x - ring,
    y: map.eagle.y - ring,
    width: BLOCK_SIZE + 2 * ring,
    height: BLOCK_SIZE + 2 * ring,
  }
}

/** 从 pos 朝 direction 开火，子弹一出膛就会打到砖，且不是老鹰外墙 */
export function brickInFront(map: TerrainMap, pos: Point, direction: Direction): boolean {
  const rect = laneRect(pos, direction, 0, ITEM_SIZE_MAP.BRICK, 0)
  if (map.brickIndicesIn(rect).length === 0) {
    return false
  }
  const guard = eagleGuard(map)
  return guard == null || !testCollide(guard, rect, -EPS)
}

/** 从 pos 朝 direction 开火、max 以内子弹飞得到的通道：到第一块砖或钢为止；一出膛就被挡住时为 null */
export function openLane(
  map: TerrainMap,
  pos: Point,
  direction: Direction,
  max: number,
): Rect | null {
  const limit = Math.min(max, edgeDistance(pos, direction))
  let to = 0
  while (to < limit) {
    const next = Math.min(to + ITEM_SIZE_MAP.BRICK, limit)
    const rect = laneRect(pos, direction, to, next, 0)
    if (map.steelIndicesIn(rect).length > 0 || map.brickIndicesIn(rect).length > 0) break
    to = next
  }
  return to > 0 ? laneRect(pos, direction, 0, to, 0) : null
}

/** 再往前走 1px 就撞上砖，而且开火能打到它：该停下来打砖了 */
export function shouldDig(map: TerrainMap, tank: Tank): boolean {
  const { axis, delta } = getDirectionInfo(tank.direction)
  const rect = tank.rect()
  rect[axis] += delta
  return map.collideBrick(rect, -EPS) && brickInFront(map, tank, tank.direction)
}

/**
 * 坦克停在 pos、朝 direction 开火时，子弹依次会碰到什么：砖只计数，碰到第一个能挡住子弹的
 * 东西为止。老鹰外墙上的砖按老鹰算。self 是开火的坦克本身，不算障碍；只看地形时为 null
 */
export function scanLane(
  map: TerrainMap,
  tanks: Tank[],
  self: Tank | null,
  pos: Point,
  direction: Direction,
): LaneScan {
  let hit: LaneScan['hit'] = { kind: 'edge', distance: edgeDistance(pos, direction) }
  const consider = (kind: LaneHitKind, rect: Rect, margin: number) => {
    const lane = laneRect(pos, direction, 0, hit.distance, margin)
    if (hit.distance > 0 && testCollide(lane, rect, -EPS)) {
      const distance = Math.max(0, distanceTo(pos, direction, rect))
      if (distance < hit.distance) {
        hit = { kind, distance }
      }
    }
  }
  for (const tank of tanks) {
    if (tank !== self && tank.alive) {
      const friendly = tank.side === 'player'
      consider(friendly ? 'player' : 'bot', tank.rect(), friendly ? FRIENDLY_MARGIN : 0)
    }
  }
  if (map.eagle != null) {
    const eagle = { x: map.eagle.x, y: map.eagle.y, width: BLOCK_SIZE, height: BLOCK_SIZE }
    consider('eagle', eagle, FRIENDLY_MARGIN)
  }

  const guard = eagleGuard(map)
  const layer = ITEM_SIZE_MAP.BRICK
  let bricks = 0
  for (let from = 0; from < hit.distance; from += layer) {
    const rect = laneRect(pos, direction, from, Math.min(from + layer, hit.distance), 0)
    if (map.steelIndicesIn(rect).length > 0) {
      return { hit: { kind: 'steel', distance: from }, bricks }
    }
    if (map.brickIndicesIn(rect).length > 0) {
      if (guard != null && testCollide(guard, rect, -EPS)) {
        return { hit: { kind: 'eagle', distance: from }, bricks }
      }
      bricks += 1
    }
  }
  return { hit, bricks }
}
