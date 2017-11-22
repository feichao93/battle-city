import { Map as IMap } from 'immutable'
import { BulletRecord } from 'types';
import { asBox, DefaultMap, testCollide } from 'utils/common'
import Collision, { CollisionWithBullet } from 'utils/Collision'
import IndexHelper from 'utils/IndexHelper';
import { BULLET_SIZE, FIELD_SIZE } from 'utils/constants'

export function getMBR(...boxes: Box[]): Box {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const box of boxes) {
    left = Math.min(left, box.x)
    top = Math.min(top, box.y)
    right = Math.max(right, box.x + box.width)
    bottom = Math.max(bottom, box.y + box.height)
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

export function lastPos(b: BulletRecord) {
  return b.merge({ x: b.lastX, y: b.lastY })
}

export class BulletCollisionInfo extends DefaultMap<BulletId, Collision[]> {
  bullets: IMap<BulletId, BulletRecord>

  constructor(bullets: IMap<BulletId, BulletRecord>) {
    super(() => [])
    this.bullets = bullets
  }

  // 获取一个Collision对象中 碰撞物体的Box对象
  // 例如输入参数collision记录了一个子弹碰到了一个Brick对象, 那么该函数将返回Brick的Box
  static getCollisionBox(collision: Collision) {
    const borderCollisionBox: Box = {
      x: FIELD_SIZE,
      y: FIELD_SIZE,
      width: -FIELD_SIZE,
      height: -FIELD_SIZE,
    }
    if (collision.type === 'brick' || collision.type === 'steel') {
      return IndexHelper.getBox(collision.type, collision.t)
    } else if (collision.type === 'border') {
      return borderCollisionBox
    } else if (collision.type === 'tank') {
      return asBox(collision.tank)
    } else if (collision.type === 'eagle') {
      return asBox(collision.eagle)
    } else { // c.type === 'bullet'
      return { x: collision.x, y: collision.y, width: 0, height: 0 }
    }
  }

  // 判断一颗子弹是否发生爆炸
  static shouldExplode(collisions: Collision[]) {
    for (const c of collisions) {
      if (c.type === 'border'
        || c.type === 'eagle'
        || c.type === 'brick'
        || c.type === 'steel'
        || c.type === 'tank' && c.shouldExplode) {
        return true
      }
    }
    return false
  }

  // 获取子弹爆炸的位置. 如果该子弹不需要爆炸, 那么该函数返回null
  getExplosionPos(bulletId: BulletId): Point {
    const collisions = this.get(bulletId)
    const bullet = this.bullets.get(bulletId)
    if (!BulletCollisionInfo.shouldExplode(collisions)) {
      return null
    }
    const cboxes = collisions.map(BulletCollisionInfo.getCollisionBox)

    if (bullet.direction === 'right') {
      // 子弹往右边运动, 我们需要找到*最左边*的碰撞对象
      const left = cboxes.reduce((left, b) => Math.min(left, b.x), Infinity)
      return { x: left - BULLET_SIZE, y: bullet.y }
    } else if (bullet.direction === 'left') {
      // 子弹往左边运动, 我们需要找到*最右边*的碰撞对象
      const right = cboxes.reduce((right, b) => Math.max(right, b.x + b.width), -Infinity)
      return { x: right, y: bullet.y }
    } else if (bullet.direction === 'up') {
      // 子弹往上方运动, 我们需要找到*最下边*的碰撞对象
      const bottom = cboxes.reduce((bottom, b) => Math.max(bottom, b.y + b.height), -Infinity)
      return { x: bullet.x, y: bottom }
    } else { // bullet.direction === 'down'
      // 子弹往下方运动, 我们需要找到*最上边*的碰撞对象
      const top = cboxes.reduce((top, b) => Math.min(top, b.y), Infinity)
      return { x: bullet.x, y: top - BULLET_SIZE }
    }
  }

  getExplosionInfo() {
    const expBullets = new Map<BulletId, BulletRecord>()
    const noExpBullets = new Map<BulletId, BulletRecord>()
    for (const bulletId of this.keys()) {
      const bullet = this.bullets.get(bulletId)
      const expPos = this.getExplosionPos(bulletId)
      if (expPos == null) {
        noExpBullets.set(bulletId, bullet)
      } else {
        // 注意expBulletSet中存放的子弹的坐标是*子弹爆炸*的坐标
        expBullets.set(bulletId, bullet.merge(expPos))
      }
    }
    return {
      expBullets: IMap(expBullets),
      noExpBullets: IMap(noExpBullets),
    }
  }
}

// 判断两个子弹在两帧之内是否发生了碰撞
// 子弹总是在进行匀速直线运动, 两个子弹发生接触就可以认为发生了碰撞
export function getCollisionInfoBetweenBullets(
  b1: BulletRecord,
  b2: BulletRecord,
): [CollisionWithBullet, CollisionWithBullet] {
  // 下面这些字段在判断是否碰撞的时候有用
  // b1.speed
  // b1.direction
  // b1.x
  // b1.y
  // b1.lastX
  // b1.lastY
  // 如果没有发生碰撞, 那么返回null
  // 如果发生碰撞, 返回对应的CollisionTarget
  // return [
  //   { type: 'bullet', bulletId: b2.bulletId, x: 0, y: 0 },
  //   { type: 'bullet', bulletId: b1.bulletId, x: 3, y: 16 }
  // ]

  // TODO 目前用了最搓的方法...
  if (testCollide(asBox(b1), asBox(b2))) {
    return [
      { type: 'bullet', otherBulletId: b2.bulletId, x: b1.x, y: b1.y, otherX: b2.x, otherY: b2.y },
      { type: 'bullet', otherBulletId: b1.bulletId, x: b2.x, y: b2.y, otherX: b1.x, otherY: b1.y },
    ]
  } else {
    return null
  }
}


const BULLET_EXPLOSION_SPREAD = 4
const BULLET_EXPLOSION_THRESHOLD = 0.01

export function spreadBullet(bullet: BulletRecord) {
  const object = asBox(bullet)
  const value = BULLET_EXPLOSION_SPREAD + BULLET_EXPLOSION_THRESHOLD
  if (bullet.direction === 'up' || bullet.direction === 'down') {
    object.x -= value
    object.width += 2 * value
    object.y -= BULLET_EXPLOSION_THRESHOLD
    object.height += BULLET_EXPLOSION_THRESHOLD
  } else {
    object.x -= BULLET_EXPLOSION_THRESHOLD
    object.width += 2 * BULLET_EXPLOSION_THRESHOLD
    object.y -= value
    object.height += 2 * value
  }
  return object
}
