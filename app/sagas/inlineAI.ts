import { List } from 'immutable'
import { delay, Channel } from 'redux-saga'
import { fork, select, take, race, call } from 'redux-saga/effects'
import { DOWN, FIELD_SIZE, ITEM_SIZE_MAP, LEFT, N_MAP, RIGHT, TANK_SIZE, UP, BLOCK_SIZE } from 'utils/constants'
import { asBox, getDirectionInfo, iterRowsAndCols } from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'
import { State, TankRecord } from 'types'

const log = console.log

// 内联的AI. 用于测试开发
export default function* inlineAI($$postMessage: any, inputChannel: Channel<any>) {
  yield fork(ai, $$postMessage, inputChannel)
  while (true) {
    yield take(['REMOVE_TANK', 'LOAD_STAGE'])
    const tank = yield select(selectors.playerTank, 'AI')
    // 选取AI的坦克, 如果坦克为null, 则生成新的坦克
    if (tank == null) {
      const { game }: State = yield select()
      if (game.get('remainingEnemyCount') > 0) {
        yield delay(2000)
        $$postMessage({ type: 'spawn-tank', x: 10 * 16, y: 0 })
      }
    }
  }
}

/** AI是否可以破坏该障碍物 */
function canDestroy(barrierType: BarrierType) {
  return barrierType === 'brick'
}

interface PriorityMap {
  up: number,
  down: number,
  left: number,
  right: number
}

interface BarrierInfoEntry {
  type: BarrierType
  length: number
}

interface BarrierInfo {
  up: BarrierInfoEntry
  down: BarrierInfoEntry
  left: BarrierInfoEntry
  right: BarrierInfoEntry
}

type BarrierType = 'border' | 'steel' | 'river' | 'brick'

function* ai($$postMessage: (message: AICommand) => void, inputChannel: Channel<any>) {
  while (true) {
    console.groupEnd()
    console.group('ai')
    yield race({
      timeout: call(delay, 1000),
      event: take(inputChannel),
    })
    let tank: TankRecord = yield select(selectors.playerTank, 'AI')
    if (tank == null) {
      continue
    }

    // 计算ai-tank与eagle的相对位置
    const { map: { eagle } }: State = yield select()
    const dy2eagle = eagle.y - tank.y
    const dx2eagle = eagle.x - tank.x

    log('dx2eagle:', dx2eagle)
    log('dy2eagle:', dy2eagle)

    // barrierInfo
    const binfo = {
      down: {},
      up: {},
      left: {},
      right: {},
    } as BarrierInfo

    const priorityMap: PriorityMap = {
      up: 2,
      down: 2,
      left: 2,
      right: 2,
    }

    // 计算往下走的优先级
    if (dy2eagle > 6 * BLOCK_SIZE) {
      priorityMap.down += 3
    } else if (dy2eagle > 4 * BLOCK_SIZE) {
      priorityMap.down += 2
    }
    const downLookAhead = lookAhead(yield select(), tank.set('direction', 'down'))
    binfo.down.type = downLookAhead[0]
    binfo.down.length = downLookAhead[1]
    if (binfo.down.length < 2 * BLOCK_SIZE && !canDestroy(binfo.down.type)) {
      priorityMap.down = 1
    }
    if (binfo.down.length === 0 && !canDestroy(binfo.down.type)) {
      priorityMap.down = 0
    }

    // 计算往上走的优先级
    if (dy2eagle < -6 * BLOCK_SIZE) {
      priorityMap.up += 3
    } else if (dy2eagle < -4 * BLOCK_SIZE) {
      priorityMap.up += 2
    }
    const upLookAhead = lookAhead(yield select(), tank.set('direction', 'up'))
    binfo.up.type = upLookAhead[0]
    binfo.up.length = upLookAhead[1]
    if (binfo.up.length < 2 * BLOCK_SIZE && !canDestroy(binfo.up.type)) {
      priorityMap.up = 1
    }
    if (binfo.up.length === 0 && !canDestroy(binfo.up.type)) {
      priorityMap.up = 0
    }

    // 计算往左走的优先级
    if (dx2eagle > 6 * BLOCK_SIZE) {
      priorityMap.left += 3
    } else if (dx2eagle > 4 * BLOCK_SIZE) {
      priorityMap.left += 2
    }
    const leftLookAhead = lookAhead(yield select(), tank.set('direction', 'left'))
    binfo.left.type = leftLookAhead[0]
    binfo.left.length = leftLookAhead[1]
    if (binfo.left.length < 2 * BLOCK_SIZE && !canDestroy(binfo.left.type)) {
      priorityMap.left = 1
    }
    if (binfo.left.length === 0 && !canDestroy(binfo.left.type)) {
      priorityMap.left = 0
    }

    // 计算往右走的优先级
    if (dx2eagle < -6 * BLOCK_SIZE) {
      priorityMap.right += 3
    } else if (dx2eagle < -4 * BLOCK_SIZE) {
      priorityMap.right += 2
    }
    const rightLookAhead = lookAhead(yield select(), tank.set('direction', 'right'))
    binfo.right.type = rightLookAhead[0]
    binfo.right.length = rightLookAhead[1]
    if (binfo.right.length < 2 * BLOCK_SIZE && !canDestroy(binfo.right.type)) {
      priorityMap.right = 1
    }
    if (binfo.right.length === 0 && !canDestroy(binfo.right.type)) {
      priorityMap.right = 1
    }

    // 计算ai-tank与最近的human-tank的相对位置
    const { tanks }: State = yield select()
    const { minDistance, nearestHumanTank } = tanks.reduce((reduction, next) => {
      if (next.side === 'user') {
        const distance = Math.abs(next.x - tank.x) + Math.abs(next.y - tank.y)
        if (distance < reduction.minDistance) {
          return { minDistance: distance, nearestHumanTank: next }
        }
      }
      return reduction
    }, { minDistance: Infinity, nearestHumanTank: null as TankRecord })
    // todo what-if nearestHumanTank == null
    const dx2NearestHumanTank = tank.x - nearestHumanTank.x
    const dy2NearestHumanTank = tank.y - nearestHumanTank.y

    const nextDirection = getRandomDirection(priorityMap)

    console.table(binfo)
    log('priority-map', priorityMap)
    log('next-direction', nextDirection)
    debugger

    if (tank.direction !== nextDirection) {
      $$postMessage({ type: 'turn', direction: nextDirection })
      tank = tank.set('direction', nextDirection)
    }
    // todo 暂时走3个block
    $$postMessage({ type: 'forward', forwardLength: 3 * BLOCK_SIZE })
    // $$postMessage({ type: 'fire', forwardLength: 3 * BLOCK_SIZE })
  }
}

function getRandomDirection({ up, down, left, right }: PriorityMap): Direction {
  const total = up + down + left + right
  let n = Math.random() * total
  n -= up
  if (n < 0) {
    return 'up'
  }
  n -= down
  if (n < 0) {
    return 'down'
  }
  n -= left
  if (n < 0) {
    return 'left'
  }
  return 'right'
}

function lookAhead({ map: { bricks, steels, rivers } }: State, tank: TankRecord): [BarrierType, number] {
  const brickAheadLength = getAheadBrickLength(bricks, tank)
  const steelAheadLength = getAheadSteelLength(steels, tank)
  const riverAheadLength = getAheadRiverLength(rivers, tank)
  if (steelAheadLength === Infinity
    && brickAheadLength === Infinity
    && riverAheadLength === Infinity) {
    let borderAheadLength
    if (tank.direction === 'up') {
      borderAheadLength = tank.y
    } else if (tank.direction === 'down') {
      borderAheadLength = FIELD_SIZE - tank.y - TANK_SIZE
    } else if (tank.direction === 'left') {
      borderAheadLength = tank.x
    } else { // RIGHT
      borderAheadLength = FIELD_SIZE - tank.x - TANK_SIZE
    }
    return ['border', borderAheadLength]
  } else if (steelAheadLength <= brickAheadLength && steelAheadLength <= riverAheadLength) {
    return ['steel', steelAheadLength]
  } else if (riverAheadLength <= brickAheadLength) {
    return ['river', riverAheadLength]
  } else {
    return ['brick', brickAheadLength]
  }
}

function getAheadBrickLength(bricks: List<boolean>, tank: TankRecord) {
  const size = ITEM_SIZE_MAP.BRICK
  const N = N_MAP.BRICK
  const { xy, updater } = getDirectionInfo(tank.direction)
  let step = 1
  while (true) {
    const iterable = iterRowsAndCols(size, asBox(tank.update(xy, updater(step * size)), -0.02))
    const array = Array.from(iterable)
    if (array.length === 0) {
      return Infinity
    }
    for (const [row, col] of array) {
      const t = row * N + col
      if (bricks.get(t)) {
        return (step - 1) * size
      }
    }
    step++
  }
}

function getAheadSteelLength(steels: List<boolean>, tank: TankRecord) {
  const size = ITEM_SIZE_MAP.STEEL
  const N = N_MAP.STEEL
  const { xy, updater } = getDirectionInfo(tank.direction)
  let step = 1
  while (true) {
    const iterable = iterRowsAndCols(size, asBox(tank.update(xy, updater(step * size)), -0.02))
    const array = Array.from(iterable)
    if (array.length === 0) {
      return Infinity
    }
    for (const [row, col] of array) {
      const t = row * N + col
      if (steels.get(t)) {
        return (step - 1) * size
      }
    }
    step++
  }
}

function getAheadRiverLength(rivers: List<boolean>, tank: TankRecord) {
  const size = ITEM_SIZE_MAP.RIVER
  const N = N_MAP.RIVER
  const { xy, updater } = getDirectionInfo(tank.direction)
  let step = 1
  while (true) {
    const iterable = iterRowsAndCols(size, asBox(tank.update(xy, updater(step * size)), -0.02))
    const array = Array.from(iterable)
    if (array.length === 0) {
      return Infinity
    }
    for (const [row, col] of array) {
      const t = row * N + col
      if (rivers.get(t)) {
        return (step - 1) * size
      }
    }
    step++
  }
}
