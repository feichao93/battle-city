import { EagleRecord, TankRecord } from '../types'

type Collision =
  | CollisionWithBrick
  | CollisionWithSteel
  | CollisionWithBorder
  | CollisionWithTank
  | CollisionWithBullet
  | CollisionWithEagle

export interface CollisionWithBrick {
  type: 'brick'
  t: number
}

export interface CollisionWithSteel {
  type: 'steel'
  t: number
}

export interface CollisionWithBorder {
  type: 'border'
  // 撞上了那个方向的墙
  which: Direction
}

export interface CollisionWithTank {
  type: 'tank'
  tank: TankRecord
  shouldExplode: boolean
}

export interface CollisionWithBullet {
  type: 'bullet'
  otherBulletId: BulletId
  // 发生碰撞时该子弹的位置
  x: number
  y: number
  // 发生碰撞时另一个子弹的位置
  otherX: number
  otherY: number
}

export interface CollisionWithEagle {
  type: 'eagle'
  eagle: EagleRecord
}

export default Collision
