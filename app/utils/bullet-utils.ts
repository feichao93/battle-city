import { Map as IMap } from 'immutable'
import { BulletRecord } from '../types'
import Collision, { CollisionWithBullet } from './Collision'
import { asRect, DefaultMap, testCollide } from './common'
import { BULLET_SIZE, FIELD_SIZE } from './constants'
import IndexHelper from './IndexHelper'

export function getMBR(...rects: Rect[]): Rect {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const rect of rects) {
    left = Math.min(left, rect.x)
    top = Math.min(top, rect.y)
    right = Math.max(right, rect.x + rect.width)
    bottom = Math.max(bottom, rect.y + rect.height)
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

  // 获取一个Collision对象中 碰撞物体的Rect对象
  // 例如输入参数collision记录了一个子弹碰到了一个Brick对象, 那么该函数将返回Brick的Rect
  static getCollisionRect(collision: Collision) {
    const borderCollisionRect: Rect = {
      x: FIELD_SIZE,
      y: FIELD_SIZE,
      width: -FIELD_SIZE,
      height: -FIELD_SIZE,
    }
    if (collision.type === 'brick' || collision.type === 'steel') {
      return IndexHelper.getRect(collision.type, collision.t)
    } else if (collision.type === 'border') {
      return borderCollisionRect
    } else if (collision.type === 'tank') {
      return asRect(collision.tank)
    } else if (collision.type === 'eagle') {
      return asRect(collision.eagle)
    } else {
      // c.type === 'bullet'
      return { x: collision.x, y: collision.y, width: 0, height: 0 }
    }
  }

  // 判断一颗子弹是否发生爆炸
  static shouldExplode(collisions: Collision[]) {
    for (const c of collisions) {
      if (
        c.type === 'border' ||
        c.type === 'eagle' ||
        c.type === 'brick' ||
        c.type === 'steel' ||
        (c.type === 'tank' && c.shouldExplode)
      ) {
        return true
      }
    }
    return false
  }

  getExplosionSoundName(bulletId: BulletId): SoundName {
    const bullet = this.bullets.get(bulletId)
    if (bullet.side === 'player') {
      const collisions = this.get(bulletId)
      if (collisions.some(c => c.type === 'steel' || c.type === 'border')) {
        return 'bullet_hit_1'
      } else if (collisions.some(c => c.type === 'brick')) {
        return 'bullet_hit_2'
      }
    }
    return null
  }

  // 获取子弹爆炸的位置. 如果该子弹不需要爆炸, 那么该函数返回null
  getExplosionPos(bulletId: BulletId): Point {
    const collisions = this.get(bulletId)
    const bullet = this.bullets.get(bulletId)
    if (!BulletCollisionInfo.shouldExplode(collisions)) {
      return null
    }
    const collisionRects = collisions.map(BulletCollisionInfo.getCollisionRect)

    if (bullet.direction === 'right') {
      // 子弹往右边运动, 我们需要找到*最左边*的碰撞对象
      const left = collisionRects.reduce((left, b) => Math.min(left, b.x), Infinity)
      return { x: left - BULLET_SIZE, y: bullet.y }
    } else if (bullet.direction === 'left') {
      // 子弹往左边运动, 我们需要找到*最右边*的碰撞对象
      const right = collisionRects.reduce((right, b) => Math.max(right, b.x + b.width), -Infinity)
      return { x: right, y: bullet.y }
    } else if (bullet.direction === 'up') {
      // 子弹往上方运动, 我们需要找到*最下边*的碰撞对象
      const bottom = collisionRects.reduce(
        (bottom, b) => Math.max(bottom, b.y + b.height),
        -Infinity,
      )
      return { x: bullet.x, y: bottom }
    } else {
      // bullet.direction === 'down'
      // 子弹往下方运动, 我们需要找到*最上边*的碰撞对象
      const top = collisionRects.reduce((top, b) => Math.min(top, b.y), Infinity)
      return { x: bullet.x, y: top - BULLET_SIZE }
    }
  }

  getExplosionInfo() {
    const expBullets = new Map<BulletId, BulletRecord>()
    const noExpBullets = new Map<BulletId, BulletRecord>()
    const soundNames: SoundName[] = []
    for (const bulletId of this.keys()) {
      const bullet = this.bullets.get(bulletId)
      const expPos = this.getExplosionPos(bulletId)
      if (expPos == null) {
        noExpBullets.set(bulletId, bullet)
      } else {
        // 注意expBullets中存放的子弹的坐标是*子弹爆炸*的坐标
        expBullets.set(bulletId, bullet.merge(expPos))
      }

      soundNames.push(this.getExplosionSoundName(bulletId))
    }

    return {
      expBullets: IMap(expBullets),
      noExpBullets: IMap(noExpBullets),
      soundNames: soundNames.filter(Boolean),
    }
  }
}

const rotateDirectionMap: { [key: string]: Direction } = {
  up: 'right',
  right: 'down',
  down: 'left',
  left: 'up',
}

/** 返回 坐标系旋转90度之后 子弹的新状态(方向/坐标) */
function rotate(bullet: BulletRecord) {
  return bullet.merge({
    direction: rotateDirectionMap[bullet.direction],
    x: -bullet.y,
    y: bullet.x,
    lastX: -bullet.lastY,
    lastY: bullet.lastX,
  })
}

// fixme 有的时候会发生 stack overflow
function calculateHitTime(b1: BulletRecord, b2: BulletRecord): number {
  if (b1.direction === 'up') {
    if (b2.direction === 'down') {
      // 两个子弹相向而行, 一定会发生碰撞
      return (b1.lastY - b2.lastY - BULLET_SIZE) / (b1.speed + b2.speed)
    } else if (b2.direction === 'up') {
      if (b1.lastY < b2.lastY) {
        //  [x]
        //  ↑ ↑
        //  | |   [x] means hitArea
        // b1 |
        //    |
        //   b2
        // b2从下方追赶b1
        return (b2.lastY - b1.lastY - BULLET_SIZE) / (b2.speed - b1.speed)
      } else {
        // 递归 b1从下方追赶b2
        return calculateHitTime(b2, b1)
      }
    } else if (b2.direction === 'left') {
      // [x] <--- b2
      //  ↑
      //  |        [x] means hitArea
      //  b1
      const hitArea = { x: b1.x, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE }

      const time1 = (b1.lastY - b2.lastY - BULLET_SIZE) / b1.speed
      const b2XAtTime1 = b2.lastX - b2.speed * time1
      const b2RectAtTime1 = { x: b2XAtTime1, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE }
      if (testCollide(hitArea, b2RectAtTime1)) {
        return time1
      }
      const time2 = (b2.lastX - b1.lastX - BULLET_SIZE) / b2.speed
      const b1YAtTime2 = b1.lastY - b1.speed * time2
      const b1RectAtTime2 = { x: b1.x, y: b1YAtTime2, width: BULLET_SIZE, height: BULLET_SIZE }
      if (testCollide(hitArea, b1RectAtTime2)) {
        return time2
      }
      return -1
    } else {
      // b2.direction === 'right'
      // b2 ---> [x]
      //          ↑     [x] means hitArea
      //          |
      //          b1
      const hitArea = { x: b1.x, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE }

      const time1 = (b1.lastY - b2.lastY - BULLET_SIZE) / b1.speed
      const b2XAtTime1 = b2.lastX + b2.speed * time1
      const b2RectAtTime1 = { x: b2XAtTime1, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE }
      if (testCollide(hitArea, b2RectAtTime1)) {
        return time1
      }
      const time2 = (b1.lastX - b2.lastX - BULLET_SIZE) / b2.speed
      const b1YAtTime2 = b1.lastY - b1.speed * time2
      const b1RectAtTime2 = { x: b1.x, y: b1YAtTime2, width: BULLET_SIZE, height: BULLET_SIZE }
      if (testCollide(hitArea, b1RectAtTime2)) {
        return time2
      }
      return -1
    }
  } else {
    // 旋啊旋. 旋转到b1 向上飞的时候...
    return calculateHitTime(rotate(b1), rotate(b2))
  }
}

/** 计算一个子弹从last-post移动time时间之后的位置 */
function moveFromLast(bullet: BulletRecord, time: number): Point {
  const distance = bullet.speed * time
  if (bullet.direction === 'up') {
    return { x: bullet.lastX, y: bullet.lastY - distance }
  } else if (bullet.direction === 'down') {
    return { x: bullet.lastX, y: bullet.lastY + distance }
  } else if (bullet.direction === 'left') {
    return { x: bullet.lastX - distance, y: bullet.lastY }
  } else {
    return { x: bullet.lastX + distance, y: bullet.lastY }
  }
}

// 判断两个子弹在两帧之内是否发生了碰撞
// 子弹总是在进行匀速直线运动, 两个子弹发生接触就可以认为发生了碰撞
// 如果没有发生碰撞, 该函数返回null
export function getCollisionInfoBetweenBullets(
  b1: BulletRecord,
  b2: BulletRecord,
  delta: number,
): [CollisionWithBullet, CollisionWithBullet] {
  const mbr1 = getMBR(asRect(lastPos(b1)), asRect(b1))
  const mbr2 = getMBR(asRect(lastPos(b2)), asRect(b2))
  if (!testCollide(mbr1, mbr2)) {
    return null
  }

  const hitTime = calculateHitTime(b1, b2)

  if (hitTime >= 0 && hitTime <= delta) {
    const p1 = moveFromLast(b1, hitTime)
    const p2 = moveFromLast(b2, hitTime)
    return [
      { type: 'bullet', otherBulletId: b2.bulletId, x: p1.x, y: p1.y, otherX: p2.x, otherY: p2.y },
      { type: 'bullet', otherBulletId: b1.bulletId, x: p2.x, y: p2.y, otherX: p1.x, otherY: p1.y },
    ]
  } else {
    return null
  }
}

const BULLET_EXPLOSION_SPREAD = 4
const BULLET_EXPLOSION_THRESHOLD = 0.01

export function spreadBullet(bullet: BulletRecord) {
  const object = asRect(bullet)
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
