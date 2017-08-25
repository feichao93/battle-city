import { delay } from 'redux-saga'
import { put } from 'redux-saga/effects'
import {
  BLOCK_SIZE,
  BULLET_SIZE,
  FIELD_SIZE,
  TANK_SIZE,
  TANK_SPAWN_DELAY,
  TANK_MOVE_SPEED_UNIT,
  BULLET_MOVE_SPEED_UNIT,
} from 'utils/constants'
import { BulletRecord, TankRecord, EagleRecord, PowerUpRecord } from 'types'

// 根据坦克的位置计算子弹的生成位置
// 参数x,y,direction为坦克的位置和方向
export function calculateBulletStartPosition({ x, y, direction }: { x: number, y: number, direction: Direction }) {
  if (direction === 'up') {
    return { x: x + 6, y: y - 3 }
  } else if (direction === 'down') {
    return { x: x + 6, y: y + BLOCK_SIZE }
  } else if (direction === 'left') {
    return { x: x - 3, y: y + 6 }
  } else if (direction === 'right') {
    return { x: x + BLOCK_SIZE, y: y + 6 }
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
export function testCollide(subject: Box, object: Box, threshhold = 0) {
  return between(subject.x - object.width, object.x, subject.x + subject.width, threshhold)
    && between(subject.y - object.height, object.y, subject.y + subject.height, threshhold)
}

// 输入itemSize和box. item对应brick/steel/river, box对应bullet/tank
// 生成器将yield满足条件<row行col列的item与box相撞>的[row, col]二元组
// itemSize: number
// box: { x: number, y: number, width: number, height: number }
export function* iterRowsAndCols(itemSize: number, box: Box) {
  const N = FIELD_SIZE / itemSize // todo should not use N
  const col1 = Math.max(0, Math.floor(box.x / itemSize))
  const col2 = Math.min(N - 1, Math.floor((box.x + box.width) / itemSize))
  const row1 = Math.max(0, Math.floor(box.y / itemSize))
  const row2 = Math.min(N - 1, Math.floor((box.y + box.height) / itemSize))
  for (let row = row1; row <= row2; row += 1) {
    for (let col = col1; col <= col2; col += 1) {
      yield [row, col]
    }
  }
}

// 判断box是否在战场内
// box: { x: number, y: number, width: number, height: number }
export function isInField(box: Box) {
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

// 将BulletRecord/TankRecord/Eagle/PowerUpRecord转换为Box类型对象
export function asBox(item: BulletRecord | TankRecord | EagleRecord | PowerUpRecord, enlargement = 0): Box {
  if (item instanceof BulletRecord) {
    return {
      x: item.x - BULLET_SIZE / 2 * enlargement,
      y: item.y - BULLET_SIZE / 2 * enlargement,
      width: BULLET_SIZE * (1 + enlargement),
      height: BULLET_SIZE * (1 + enlargement),
    }
  } else if (item instanceof TankRecord) {
    return {
      x: item.x - TANK_SIZE / 2 * enlargement,
      y: item.y - TANK_SIZE / 2 * enlargement,
      width: TANK_SIZE * (1 + enlargement),
      height: TANK_SIZE * (1 + enlargement),
    }
  } else if (item instanceof EagleRecord) {
    return {
      x: item.x - BLOCK_SIZE / 2 * enlargement,
      y: item.y - BLOCK_SIZE / 2 * enlargement,
      width: BLOCK_SIZE * (1 + enlargement),
      height: BLOCK_SIZE * (1 + enlargement),
    }
  } else if (item instanceof PowerUpRecord) {
    console.assert(enlargement === -0.5)
    return {
      x: item.x - BLOCK_SIZE / 2 * enlargement,
      y: item.y - BLOCK_SIZE / 2 * enlargement,
      width: BLOCK_SIZE * (1 + enlargement),
      height: BLOCK_SIZE * (1 + enlargement),
    }
  } else {
    throw new Error('Cannot convert to type Box')
  }
}

type UpdaterMaker = (amount: number) => (x: number) => number
export const inc: UpdaterMaker = amount => x => x + amount
export const dec: UpdaterMaker = amount => x => x - amount

export function getDirectionInfo(direction: Direction, flipxy = false) {
  let result: { xy: 'x' | 'y', updater: UpdaterMaker }
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

export function* spawnTank(tank: TankRecord) {
  yield put({
    type: 'SPAWN_FLICKER',
    flickerId: getNextId('flicker'),
    x: tank.x,
    y: tank.y,
  })
  yield delay(TANK_SPAWN_DELAY)
  const tankId = getNextId('tank')
  yield put({
    type: 'SPAWN_TANK',
    tank: tank.set('tankId', tankId),
  })
  return tankId
}

export function reverseDirection(direction: Direction): Direction {
  if (direction === 'up') {
    return 'down'
  }
  if (direction === 'down') {
    return 'up'
  }
  if (direction === 'left') {
    return 'right'
  }
  if (direction === 'right') {
    return 'left'
  }
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

export function getTankBulletLimit(tank: TankRecord) {
  if (tank.side === 'ai' || tank.level === 'basic' || tank.level === 'fast') {
    return 1
  } else {
    return 2
  }
}

export function getTankBulletSpeed(tank: TankRecord) {
  if (tank.side === 'human') {
    if (tank.level === 'basic') {
      return 2 * BULLET_MOVE_SPEED_UNIT
    } else {
      return 3 * BULLET_MOVE_SPEED_UNIT
    }
  } else {
    if (tank.level === 'basic') {
      return BULLET_MOVE_SPEED_UNIT
    } else if (tank.level === 'power') {
      return 3 * BULLET_MOVE_SPEED_UNIT
    } else {
      return 2 * BULLET_MOVE_SPEED_UNIT
    }
  }
}

export function getTankBulletInterval(tank: TankRecord) {
  // todo 需要校准数值
  return 300
}

export function getTankMoveSpeed(tank: TankRecord) {
  if (tank.side === 'human') {
    return 2 * TANK_MOVE_SPEED_UNIT
  } else if (tank.level === 'basic') {
    return TANK_MOVE_SPEED_UNIT
  } else if (tank.level === 'fast') {
    return 3 * TANK_MOVE_SPEED_UNIT
  } else {
    return 2 * TANK_MOVE_SPEED_UNIT
  }
}

export function getTankBulletPower(tank: TankRecord) {
  if (tank.side === 'human' && tank.level === 'armor') {
    return 3
  } else if (tank.side === 'ai' && tank.level === 'power') {
    return 2
  } else {
    return 1
  }
}
