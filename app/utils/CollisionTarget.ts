type CollisionTarget = CollisionTargetBrick
  | CollisionTargetSteel
  | CollisionTargetBorder
  | CollisionTargetHumanTank
  | CollisionTargetBullet

export interface CollisionTargetBrick {
  type: 'brick'
  t: number
}

export interface CollisionTargetSteel {
  type: 'steel'
  t: number
}

export interface CollisionTargetBorder {
  type: 'border'
  // 撞上了那个方向的墙
  direction: Direction
}

export interface CollisionTargetHumanTank {
  type: 'tank'
  tankId: TankId
  shouldExplode: boolean
}

export interface CollisionTargetBullet {
  type: 'bullet'
  bulletId: BulletId
}

export default CollisionTarget
