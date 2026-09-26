import { BLOCK_SIZE, FIELD_SIZE, ITEM_SIZE_MAP, TANK_SIZE } from '../constants'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import { getDirectionInfo, type Rect } from '../physics/geometry'
import type { Direction, Point } from '../types'

export type BarrierType = 'border' | 'steel' | 'river' | 'brick'

export interface BarrierInfoEntry {
  type: BarrierType
  length: number
}

export interface TankEnv {
  eagle: RelativePosition | null
  nearestPlayer: RelativePosition | null
  barrier: Record<Direction, BarrierInfoEntry>
}

/** 两点（左上角坐标）的相对位置 */
export class RelativePosition {
  readonly dx: number
  readonly dy: number
  readonly absdx: number
  readonly absdy: number

  constructor(subject: Point, object: Point) {
    this.dx = object.x - subject.x
    this.dy = object.y - subject.y
    this.absdx = Math.abs(this.dx)
    this.absdy = Math.abs(this.dy)
  }

  getPrimaryDirection(): Direction {
    if (this.absdx > this.absdy) {
      return this.dx > 0 ? 'right' : 'left'
    }
    return this.dy > 0 ? 'down' : 'up'
  }

  /** 沿某方向到达目标的前进距离 length 与垂直偏移 offset */
  getForwardInfo(direction: Direction): { length: number; offset: number } {
    switch (direction) {
      case 'left':
        return { length: -this.dx, offset: this.absdy }
      case 'right':
        return { length: this.dx, offset: this.absdy }
      case 'up':
        return { length: -this.dy, offset: this.absdx }
      case 'down':
        return { length: this.dy, offset: this.absdx }
    }
  }
}

const FireThreshold = {
  eagle(len: number): number {
    if (len < 0) return 0.1
    if (len <= 6 * BLOCK_SIZE) return 0.6
    return 0
  },
  playerTank(len: number): number {
    if (len < 0) return 0.1
    if (len <= 6 * BLOCK_SIZE) return 0.5
    return 0
  },
  destroyable(len: number): number {
    return 0.6 - len / 300
  },
  idle(): number {
    return 0.05
  },
}

function movedTankRect(tank: Tank, axis: 'x' | 'y', amount: number): Rect {
  const shrink = 0.16
  const base = {
    x: tank.x + shrink,
    y: tank.y + shrink,
    width: TANK_SIZE - 2 * shrink,
    height: TANK_SIZE - 2 * shrink,
  }
  if (axis === 'x') base.x += amount
  else base.y += amount
  return base
}

function aheadLength(
  tank: Tank,
  size: number,
  hasCell: (r: Rect) => boolean,
): number {
  const { axis, delta } = getDirectionInfo(tank.direction)
  for (let step = 1; step < 64; step += 1) {
    const rect = movedTankRect(tank, axis, delta * step * size)
    if (rect.x + rect.width <= 0 || rect.x >= FIELD_SIZE || rect.y + rect.height <= 0 || rect.y >= FIELD_SIZE) {
      return Infinity
    }
    if (hasCell(rect)) {
      return (step - 1) * size
    }
  }
  return Infinity
}

/** 朝当前方向观察前方最近障碍 */
function lookAhead(map: TerrainMap, tank: Tank): BarrierInfoEntry {
  const brickLen = aheadLength(tank, ITEM_SIZE_MAP.BRICK, (r) => map.brickIndicesIn(r).length > 0)
  const steelLen = aheadLength(tank, ITEM_SIZE_MAP.STEEL, (r) => map.steelIndicesIn(r).length > 0)
  const riverLen = aheadLength(tank, ITEM_SIZE_MAP.RIVER, (r) => map.collideRiver(r, -0.02))
  if (brickLen === Infinity && steelLen === Infinity && riverLen === Infinity) {
    let border: number
    if (tank.direction === 'up') border = tank.y
    else if (tank.direction === 'down') border = FIELD_SIZE - tank.y - TANK_SIZE
    else if (tank.direction === 'left') border = tank.x
    else border = FIELD_SIZE - tank.x - TANK_SIZE
    return { type: 'border', length: border }
  } else if (steelLen <= brickLen && steelLen <= riverLen) {
    return { type: 'steel', length: steelLen }
  } else if (riverLen <= brickLen) {
    return { type: 'river', length: riverLen }
  } else {
    return { type: 'brick', length: brickLen }
  }
}

/** 收集 bot 的环境信息：与老鹰/最近玩家的相对位、四向前方障碍 */
export function getEnv(map: TerrainMap, tanks: Tank[], tank: Tank): TankEnv {
  const eagle = map.eagle != null ? new RelativePosition(tank, map.eagle) : null

  let nearest: Tank | null = null
  let minDist = Infinity
  for (const t of tanks) {
    if (t.side === 'player' && t.alive) {
      const d = Math.abs(t.x - tank.x) + Math.abs(t.y - tank.y)
      if (d < minDist) {
        minDist = d
        nearest = t
      }
    }
  }
  const nearestPlayer = nearest != null ? new RelativePosition(tank, nearest) : null

  const probe = (direction: Direction): BarrierInfoEntry => {
    const saved = tank.direction
    tank.direction = direction
    const result = lookAhead(map, tank)
    tank.direction = saved
    return result
  }

  return {
    eagle,
    nearestPlayer,
    barrier: {
      up: probe('up'),
      down: probe('down'),
      left: probe('left'),
      right: probe('right'),
    },
  }
}

/** 根据环境概率性地决定是否开火 */
export function determineFire(tank: Tank, env: TankEnv): boolean {
  const random = Math.random()
  const ahead = env.barrier[tank.direction]

  if (ahead.type === 'brick' && random < FireThreshold.destroyable(ahead.length)) {
    return true
  }
  if (env.eagle != null) {
    const info = env.eagle.getForwardInfo(tank.direction)
    if (info.offset <= 8 && random < FireThreshold.eagle(info.length)) {
      return true
    }
  }
  if (env.nearestPlayer != null) {
    const info = env.nearestPlayer.getForwardInfo(tank.direction)
    if (info.offset <= 8 && random < FireThreshold.playerTank(info.length)) {
      return true
    }
  }
  return random < FireThreshold.idle()
}
