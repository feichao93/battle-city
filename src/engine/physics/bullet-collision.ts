import { BULLET_SIZE } from '../constants'
import type Bullet from '../entities/Bullet'
import type { Direction } from '../types'
import { testCollide, type Rect } from './geometry'

/** 多个矩形的最小包含矩形（MBR），用于子弹两帧间的连续碰撞 */
export function getMBR(...rects: Rect[]): Rect {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const r of rects) {
    left = Math.min(left, r.x)
    top = Math.min(top, r.y)
    right = Math.max(right, r.x + r.width)
    bottom = Math.max(bottom, r.y + r.height)
  }
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/** 子弹本帧移动轨迹的 MBR（上一步位置 → 当前位置） */
export function bulletMBR(bullet: Bullet): Rect {
  return getMBR(bullet.lastRect(), bullet.rect())
}

const BULLET_EXPLOSION_SPREAD = 4
const BULLET_EXPLOSION_THRESHOLD = 0.01

/**
 * 子弹爆炸时影响的区域：沿垂直于飞行方向扩展 4px，便于一次打掉一段墙。
 * 注意应在子弹「爆炸落点」坐标上调用。
 */
export function spreadBullet(bullet: Bullet): Rect {
  const r = bullet.rect()
  const v = BULLET_EXPLOSION_SPREAD + BULLET_EXPLOSION_THRESHOLD
  if (bullet.direction === 'up' || bullet.direction === 'down') {
    r.x -= v
    r.width += 2 * v
    r.y -= BULLET_EXPLOSION_THRESHOLD
    r.height += BULLET_EXPLOSION_THRESHOLD
  } else {
    r.x -= BULLET_EXPLOSION_THRESHOLD
    r.width += 2 * BULLET_EXPLOSION_THRESHOLD
    r.y -= v
    r.height += 2 * v
  }
  return r
}

const rotateDirectionMap: Record<Direction, Direction> = {
  up: 'right',
  right: 'down',
  down: 'left',
  left: 'up',
}

/** 子弹在「坐标系顺时针旋转 90°」后的等价状态，用于把任意方向归约到 up */
function rotate(b: Bullet): Bullet {
  return {
    ...b,
    direction: rotateDirectionMap[b.direction],
    x: -b.y,
    y: b.x,
    lastX: -b.lastY,
    lastY: b.lastX,
  } as Bullet
}

/** 计算两子弹从各自 last 位置出发发生接触的时刻（ms），无碰撞返回 -1 */
function calculateHitTime(b1: Bullet, b2: Bullet): number {
  if (b1.direction === 'up') {
    if (b2.direction === 'down') {
      return (b1.lastY - b2.lastY - BULLET_SIZE) / (b1.speed + b2.speed)
    } else if (b2.direction === 'up') {
      if (b1.lastY < b2.lastY) {
        return (b2.lastY - b1.lastY - BULLET_SIZE) / (b2.speed - b1.speed)
      } else {
        return calculateHitTime(b2, b1)
      }
    } else if (b2.direction === 'left') {
      const hitArea: Rect = { x: b1.x, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE }
      const time1 = (b1.lastY - b2.lastY - BULLET_SIZE) / b1.speed
      const b2XAtTime1 = b2.lastX - b2.speed * time1
      if (testCollide(hitArea, { x: b2XAtTime1, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE })) {
        return time1
      }
      const time2 = (b2.lastX - b1.lastX - BULLET_SIZE) / b2.speed
      const b1YAtTime2 = b1.lastY - b1.speed * time2
      if (testCollide(hitArea, { x: b1.x, y: b1YAtTime2, width: BULLET_SIZE, height: BULLET_SIZE })) {
        return time2
      }
      return -1
    } else {
      // b2.direction === 'right'
      const hitArea: Rect = { x: b1.x, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE }
      const time1 = (b1.lastY - b2.lastY - BULLET_SIZE) / b1.speed
      const b2XAtTime1 = b2.lastX + b2.speed * time1
      if (testCollide(hitArea, { x: b2XAtTime1, y: b2.y, width: BULLET_SIZE, height: BULLET_SIZE })) {
        return time1
      }
      const time2 = (b1.lastX - b2.lastX - BULLET_SIZE) / b2.speed
      const b1YAtTime2 = b1.lastY - b1.speed * time2
      if (testCollide(hitArea, { x: b1.x, y: b1YAtTime2, width: BULLET_SIZE, height: BULLET_SIZE })) {
        return time2
      }
      return -1
    }
  } else {
    return calculateHitTime(rotate(b1), rotate(b2))
  }
}

/** 子弹从 last 位置运动 time 之后的落点 */
function moveFromLast(b: Bullet, time: number): { x: number; y: number } {
  const distance = b.speed * time
  switch (b.direction) {
    case 'up':
      return { x: b.lastX, y: b.lastY - distance }
    case 'down':
      return { x: b.lastX, y: b.lastY + distance }
    case 'left':
      return { x: b.lastX - distance, y: b.lastY }
    case 'right':
      return { x: b.lastX + distance, y: b.lastY }
  }
}

export interface BulletHitPoint {
  x: number
  y: number
}

/**
 * 判断两子弹本帧（delta）内是否相撞。相撞返回两者的接触落点，否则 null。
 * 子弹匀速直线运动，先用 MBR 粗筛，再精确求交时刻。
 */
export function getBulletCollision(
  b1: Bullet,
  b2: Bullet,
  delta: number,
): [BulletHitPoint, BulletHitPoint] | null {
  if (!testCollide(bulletMBR(b1), bulletMBR(b2))) {
    return null
  }
  const hitTime = calculateHitTime(b1, b2)
  if (hitTime >= 0 && hitTime <= delta) {
    return [moveFromLast(b1, hitTime), moveFromLast(b2, hitTime)]
  }
  return null
}

/**
 * 根据所有碰撞对象的矩形，求子弹的爆炸落点（贴着最近的障碍物）。
 * direction 决定取哪条边。
 */
export function explosionPosFromRects(bullet: Bullet, rects: Rect[]): { x: number; y: number } {
  if (bullet.direction === 'right') {
    const left = rects.reduce((m, r) => Math.min(m, r.x), Infinity)
    return { x: left - BULLET_SIZE, y: bullet.y }
  } else if (bullet.direction === 'left') {
    const right = rects.reduce((m, r) => Math.max(m, r.x + r.width), -Infinity)
    return { x: right, y: bullet.y }
  } else if (bullet.direction === 'up') {
    const bottom = rects.reduce((m, r) => Math.max(m, r.y + r.height), -Infinity)
    return { x: bullet.x, y: bottom }
  } else {
    const top = rects.reduce((m, r) => Math.min(m, r.y), Infinity)
    return { x: bullet.x, y: top - BULLET_SIZE }
  }
}

/** 撞墙/出界时，碰撞物对应的矩形（边界用特制矩形，使取边公式自然成立） */
export function borderCollisionRect(fieldSize: number): Rect {
  return { x: fieldSize, y: fieldSize, width: -fieldSize, height: -fieldSize }
}
