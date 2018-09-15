import { BulletRecord, EagleRecord, PowerUpRecord, TankRecord } from '../types'
import { BLOCK_SIZE, BULLET_SIZE, FIELD_SIZE, TANK_SIZE } from './constants'

// 根据坦克的位置计算子弹的生成位置
// 参数x,y,direction为坦克的位置和方向
export function calculateBulletStartPosition({
  x,
  y,
  direction,
}: {
  x: number
  y: number
  direction: Direction
}) {
  if (direction === 'up') {
    return { x: x + 6, y }
  } else if (direction === 'down') {
    return { x: x + 6, y: y + 13 }
  } else if (direction === 'left') {
    return { x, y: y + 6 }
  } else if (direction === 'right') {
    return { x: x + 13, y: y + 6 }
  } else {
    throw new Error(`Invalid direction ${direction}`)
  }
}

export function between(min: number, value: number, max: number, threshhold = 0) {
  return min - threshhold <= value && value <= max + threshhold
}

export function getRowCol(t: number, N: number) {
  return [Math.floor(t / N), t % N]
}

/** 用来判断subject和object是否相撞 */
export function testCollide(subject: Rect, object: Rect, threshhold = 0) {
  return (
    between(subject.x - object.width, object.x, subject.x + subject.width, threshhold) &&
    between(subject.y - object.height, object.y, subject.y + subject.height, threshhold)
  )
}

export const frame = (x: number) => (1000 / 60) * x

// 判断rect是否在战场内
export function isInField(rect: Rect) {
  return between(0, rect.x, FIELD_SIZE - rect.width) && between(0, rect.y, FIELD_SIZE - rect.height)
}

const nextIdMap = new Map<string, number>()

export function getNextId(tag = '') {
  if (nextIdMap.has(tag)) {
    const nextId = nextIdMap.get(tag)
    nextIdMap.set(tag, nextId + 1)
    return nextId
  } else {
    nextIdMap.set(tag, 2)
    return 1
  }
}

// 将BulletRecord/TankRecord/Eagle/PowerUpRecord转换为Rect类型对象
export function asRect(
  item: BulletRecord | TankRecord | EagleRecord | PowerUpRecord,
  enlargement = 0,
): Rect {
  if (item instanceof BulletRecord) {
    return {
      x: item.x - (BULLET_SIZE / 2) * enlargement,
      y: item.y - (BULLET_SIZE / 2) * enlargement,
      width: BULLET_SIZE * (1 + enlargement),
      height: BULLET_SIZE * (1 + enlargement),
    }
  } else if (item instanceof TankRecord) {
    return {
      x: item.x - (TANK_SIZE / 2) * enlargement,
      y: item.y - (TANK_SIZE / 2) * enlargement,
      width: TANK_SIZE * (1 + enlargement),
      height: TANK_SIZE * (1 + enlargement),
    }
  } else if (item instanceof EagleRecord) {
    return {
      x: item.x - (BLOCK_SIZE / 2) * enlargement,
      y: item.y - (BLOCK_SIZE / 2) * enlargement,
      width: BLOCK_SIZE * (1 + enlargement),
      height: BLOCK_SIZE * (1 + enlargement),
    }
  } else if (item instanceof PowerUpRecord) {
    DEV.ASSERT && console.assert(enlargement === -0.5)
    return {
      x: item.x - (BLOCK_SIZE / 2) * enlargement,
      y: item.y - (BLOCK_SIZE / 2) * enlargement,
      width: BLOCK_SIZE * (1 + enlargement),
      height: BLOCK_SIZE * (1 + enlargement),
    }
  } else {
    throw new Error('Cannot convert to type Rect')
  }
}

type UpdaterMaker = (amount: number) => (x: number) => number
export const inc: UpdaterMaker = amount => x => x + amount
export const dec: UpdaterMaker = amount => x => x - amount
export const or: UpdaterMaker = amount => x => x | amount
export const add = (x: number, y: number) => x + y

export function getDirectionInfo(direction: Direction, flipxy = false) {
  let result: { xy: 'x' | 'y'; updater: UpdaterMaker }
  if (direction === 'up') {
    result = { xy: 'y', updater: dec }
  } else if (direction === 'down') {
    result = { xy: 'y', updater: inc }
  } else if (direction === 'left') {
    result = { xy: 'x', updater: dec }
  } else if (direction === 'right') {
    result = { xy: 'x', updater: inc }
  } else {
    throw new Error('Invalid direction')
  }
  if (flipxy) {
    result.xy = result.xy === 'x' ? 'y' : 'x'
  }
  return result
}

export function incTankLevel(tank: TankRecord) {
  if (tank.level === 'basic') {
    return tank.set('level', 'fast')
  } else if (tank.level === 'fast') {
    return tank.set('level', 'power')
  } else {
    return tank.set('level', 'armor')
  }
}

export class DefaultMap<K, V> extends Map<K, V> {
  constructor(readonly defaulter: () => V) {
    super()
  }

  get(key: K) {
    if (!super.has(key)) {
      this.set(key, this.defaulter())
    }
    return super.get(key)!
  }
}

export function randint(start: number, end: number) {
  return Math.floor(Math.random() * (end - start)) + start
}

export const round8 = (x: number) => Math.round(x / 8) * 8
export const floor8 = (x: number) => Math.floor(x / 8) * 8
export const ceil8 = (x: number) => Math.ceil(x / 8) * 8

export function xor(p: boolean, q: boolean) {
  return (p && !q) || (!p && q)
}

export function isPerpendicular(dir1: Direction, dir2: Direction) {
  const isDir1Vertical = dir1 === 'up' || dir1 === 'down'
  const isDir2Vertical = dir2 === 'up' || dir2 === 'down'
  return xor(isDir1Vertical, isDir2Vertical)
}
