import { FIELD_SIZE } from '../constants'
import type { Direction } from '../types'

/** 轴对齐矩形，坐标为左上角 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** value 是否落在 [min, max] 内，threshold 为允许的越界量 */
export function between(min: number, value: number, max: number, threshold = 0): boolean {
  return min - threshold <= value && value <= max + threshold
}

/**
 * AABB 碰撞检测。threshold 为负时（如 -0.01）允许微小重叠，
 * 用来抵消浮点误差并匹配原版手感。
 */
export function testCollide(a: Rect, b: Rect, threshold = 0): boolean {
  return (
    between(a.x - b.width, b.x, a.x + a.width, threshold) &&
    between(a.y - b.height, b.y, a.y + a.height, threshold)
  )
}

/** rect 是否完整位于战场内 */
export function isInField(rect: Rect): boolean {
  return between(0, rect.x, FIELD_SIZE - rect.width) && between(0, rect.y, FIELD_SIZE - rect.height)
}

export const round8 = (x: number): number => Math.round(x / 8) * 8
export const floor8 = (x: number): number => Math.floor(x / 8) * 8
export const ceil8 = (x: number): number => Math.ceil(x / 8) * 8

/** 两个方向是否互相垂直 */
export function isPerpendicular(d1: Direction, d2: Direction): boolean {
  const v1 = d1 === 'up' || d1 === 'down'
  const v2 = d2 === 'up' || d2 === 'down'
  return v1 !== v2
}

/** 方向对应的移动轴与正负号（delta=+1 表示坐标增大） */
export function getDirectionInfo(direction: Direction): { axis: 'x' | 'y'; delta: 1 | -1 } {
  switch (direction) {
    case 'up':
      return { axis: 'y', delta: -1 }
    case 'down':
      return { axis: 'y', delta: 1 }
    case 'left':
      return { axis: 'x', delta: -1 }
    case 'right':
      return { axis: 'x', delta: 1 }
  }
}
