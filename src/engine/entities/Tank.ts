import { TANK_SIZE } from '../constants'
import type { Rect } from '../physics/geometry'
import type { Direction, TankColor, TankLevel, TankSide } from '../types'

let nextTankId = 1

export interface TankInit {
  side: TankSide
  level?: TankLevel
  color?: TankColor
  direction?: Direction
  x: number
  y: number
  hp?: number
  helmetDuration?: number
  withPowerUp?: boolean
}

/**
 * 战场坦克实体（可变对象，逐帧原地更新，不走 React）。
 * 坐标 x/y 取左上角；尺寸固定 16×16。
 */
export default class Tank {
  readonly tankId: number
  side: TankSide
  level: TankLevel
  color: TankColor
  x: number
  y: number
  direction: Direction
  /** 是否在本帧发生平移（驱动履带动画） */
  moving = false
  hp: number
  alive = true

  /** 转向预留坐标：沿当前移动轴吸附到 8 的倍数后的落点，供垂直转向时对齐使用 */
  rx: number
  ry: number

  /** 冰面剩余滑行量（px），只有玩家坦克使用；离开冰面时保留，回到冰面继续生效 */
  slide = 0
  /** >0 表示被冻结（队友命中/timer），需等待若干 ms 才能再移动；转向不受影响 */
  frozenTimeout = 0
  /** >0 表示开火冷却中 */
  cooldown = 0
  /** >0 表示处于无敌头盔保护中（ms） */
  helmetDuration = 0
  /** 是否可见（被队友击中冻结时闪烁） */
  visible = true
  /** 该 bot 是否携带道具（被击中时掉落） */
  withPowerUp = false
  /** 进入战场的场景时间（出生闪烁结束时），bot 变色动画以此为起点 */
  bornAt = 0

  constructor(init: TankInit) {
    this.tankId = nextTankId++
    this.side = init.side
    this.level = init.level ?? 'basic'
    this.color = init.color ?? (init.side === 'player' ? 'yellow' : 'silver')
    this.direction = init.direction ?? 'up'
    this.x = init.x
    this.y = init.y
    this.rx = init.x
    this.ry = init.y
    this.hp = init.hp ?? 1
    this.helmetDuration = init.helmetDuration ?? 0
    this.withPowerUp = init.withPowerUp ?? false
  }

  rect(): Rect {
    return { x: this.x, y: this.y, width: TANK_SIZE, height: TANK_SIZE }
  }
}

/** 仅用于测试：重置自增 id，保证用例间确定性 */
export function resetTankIds(): void {
  nextTankId = 1
}
