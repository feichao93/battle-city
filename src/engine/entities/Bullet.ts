import { BULLET_SIZE } from '../constants'
import type { Rect } from '../physics/geometry'
import type { Direction, TankSide } from '../types'

let nextBulletId = 1

export interface BulletInit {
  side: TankSide
  tankId: number
  direction: Direction
  speed: number
  power: number
  x: number
  y: number
}

/** 子弹实体（可变）。lastX/lastY 记录上一步位置，用于 MBR 连续碰撞检测。 */
export default class Bullet {
  readonly bulletId: number
  side: TankSide
  tankId: number
  direction: Direction
  speed: number
  power: number
  x: number
  y: number
  lastX: number
  lastY: number
  /** 标记为待移除（命中/对撞/出界） */
  dead = false

  constructor(init: BulletInit) {
    this.bulletId = nextBulletId++
    this.side = init.side
    this.tankId = init.tankId
    this.direction = init.direction
    this.speed = init.speed
    this.power = init.power
    this.x = init.x
    this.y = init.y
    this.lastX = init.x
    this.lastY = init.y
  }

  rect(): Rect {
    return { x: this.x, y: this.y, width: BULLET_SIZE, height: BULLET_SIZE }
  }

  lastRect(): Rect {
    return { x: this.lastX, y: this.lastY, width: BULLET_SIZE, height: BULLET_SIZE }
  }
}

/** 仅用于测试：重置自增 id */
export function resetBulletIds(): void {
  nextBulletId = 1
}
