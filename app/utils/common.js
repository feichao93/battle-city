import {
  UP,
  DOWN,
  LEFT,
  RIGHT,
  BLOCK_SIZE,
  FIELD_SIZE,
  BULLET_SIZE,
  TANK_SIZE,
} from 'utils/constants'
import BulletRecord from 'types/BulletRecord'
import TankRecord from 'types/TankRecord'

// 根据坦克的位置计算子弹的生成位置
// 参数x,y,direction为坦克的位置和方向
export function calculateBulletStartPosition({ x, y, direction }) {
  if (direction === UP) {
    return { x: x + 6, y: y - 3 }
  } else if (direction === DOWN) {
    return { x: x + 6, y: y + BLOCK_SIZE }
  } else if (direction === LEFT) {
    return { x: x - 3, y: y + 6 }
  } else if (direction === RIGHT) {
    return { x: x + BLOCK_SIZE, y: y + 6 }
  } else {
    throw new Error(`Invalid direction ${direction}`)
  }
}

export function between(min, value, max, threshhold = 0) {
  return min - threshhold <= value && value <= max + threshhold
}

export function getRowCol(t, N) {
  return [Math.floor(t / N), t % N]
}

// 用来判断subject和object是否相撞
// subject: { x: number, y: number, width: number, height: number }
// object: { x: number, y: number, width: number, height: number }
export function testCollide(subject, object, threshhold = 0) {
  return between(subject.x - object.width, object.x, subject.x + subject.width, threshhold)
    && between(subject.y - object.height, object.y, subject.y + subject.height, threshhold)
}

// 输入itemSize和box. item对应brick/steel/river, box对应bullet/tank
// 生成器将yield满足条件<row行col列的item与box相撞>的[row, col]二元组
// itemSize: number
// box: { x: number, y: number, width: number, height: number }
export function* iterRowsAndCols(itemSize, box) {
  const col1 = Math.floor(box.x / itemSize)
  const col2 = Math.floor((box.x + box.width) / itemSize)
  const row1 = Math.floor(box.y / itemSize)
  const row2 = Math.floor((box.y + box.height) / itemSize)
  for (let row = row1; row <= row2; row += 1) {
    for (let col = col1; col <= col2; col += 1) {
      yield [row, col]
    }
  }
}

// 判断box是否在战场内
// box: { x: number, y: number, width: number, height: number }
export function isInField(box) {
  return between(0, box.x, FIELD_SIZE - box.width)
    && between(0, box.y, FIELD_SIZE - box.height)
}

const nextIdMap = new Map()
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

// 将BulletRecord/TankRecord转换为Box类型对象
export function asBox(item) {
  if (item instanceof BulletRecord) {
    return {
      x: item.x,
      y: item.y,
      width: BULLET_SIZE,
      height: BULLET_SIZE,
    }
  } else if (item instanceof TankRecord) {
    return {
      x: item.x,
      y: item.y,
      width: TANK_SIZE,
      height: TANK_SIZE,
    }
  } else {
    throw new Error('Cannot convert to type Box')
  }
}

export const inc = amount => x => x + amount
export const dec = amount => x => x - amount
