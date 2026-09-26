import { BLOCK_SIZE } from '../constants'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import type { Point } from '../types'
import { isInField, testCollide, type Rect } from './geometry'

/** canTankMove 所需的最小世界视图 */
export interface CollisionWorld {
  map: TerrainMap
  tanks: Tank[]
  /** 正在出生的坦克占位（旧版 restrictedAreas），其他坦克不能进入 */
  restrictedAreas: Rect[]
}

function eagleRect(eagle: Point): Rect {
  return { x: eagle.x, y: eagle.y, width: BLOCK_SIZE, height: BLOCK_SIZE }
}

/** other 是否位于 tank 前方（按 tank 当前朝向判断） */
function isInFront(other: Rect, tank: Tank): boolean {
  switch (tank.direction) {
    case 'left':
      return other.x < tank.x
    case 'right':
      return other.x > tank.x
    case 'up':
      return other.y < tank.y
    case 'down':
      return other.y > tank.y
  }
}

/**
 * 判断坦克在其当前 x/y 是否合法（可停留/可移动到）。
 * 检查：战场边界、老鹰、砖、钢、河、出生占位、其他存活坦克。snow/forest 可通行不检查。
 * threshold 默认 -0.01：允许微小重叠，匹配原版手感。
 */
export function canTankMove(world: CollisionWorld, tank: Tank, threshold = -0.01): boolean {
  const rect = tank.rect()

  if (!isInField(rect)) {
    return false
  }

  const { map } = world
  if (map.eagle != null && testCollide(eagleRect(map.eagle), rect, threshold)) {
    return false
  }
  if (map.collideBrick(rect, threshold)) {
    return false
  }
  if (map.collideSteel(rect, threshold)) {
    return false
  }
  if (map.collideRiver(rect, threshold)) {
    return false
  }
  if (world.restrictedAreas.some((area) => testCollide(area, rect, threshold))) {
    return false
  }

  // 与其他存活坦克碰撞：只考虑前方坦克，且用对方的「预留位置」
  for (const other of world.tanks) {
    if (other === tank || !other.alive) {
      continue
    }
    const otherRect: Rect = { x: other.rx, y: other.ry, width: BLOCK_SIZE, height: BLOCK_SIZE }
    if (isInFront(otherRect, tank) && testCollide(otherRect, rect, threshold)) {
      return false
    }
  }

  return true
}
