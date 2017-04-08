import { List } from 'immutable'
import { delay, Channel } from 'redux-saga'
import { fork, select, take, race, call } from 'redux-saga/effects'
import { DOWN, FIELD_SIZE, ITEM_SIZE_MAP, LEFT, N_MAP, RIGHT, TANK_SIZE, UP } from 'utils/constants'
import { asBox, getDirectionInfo, iterRowsAndCols } from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'
import { State, TankRecord, Direction } from 'types'

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

function* ai($$postMessage: any, inputChannel: Channel<any>) {
  while (true) {
    yield race({
      timeout: call(delay, 1000),
      event: take(inputChannel),
    })
    console.debug('='.repeat(20))
    let tank: TankRecord = yield select(selectors.playerTank, 'AI')
    if (tank == null) {
      continue
    }

    // eagle: Map<{ x, y }>
    const { map: { eagle } }: State = yield select()
    const dx = eagle.x - tank.x
    const dy = eagle.y - tank.y
    let horizontal: Direction = null
    let vertical: Direction = null
    if (dx > 1) {
      horizontal = 'right'
    } else if (dx < -1) {
      horizontal = 'left'
    }
    if (dy > 1) {
      vertical = 'down'
    } else if (dy < -1) {
      vertical = 'up'
    }
    const directions: Direction[] = []
    if (tank.direction === 'up' || tank.direction === 'down') {
      vertical && directions.push(vertical)
      horizontal && directions.push(horizontal)
    } else {
      horizontal && directions.push(horizontal)
      vertical && directions.push(vertical)
    }

    // 先尝试一个方向, 如果该方向行不通的话, 进行转弯尝试另一个方向
    for (const direction of directions) {
      if (tank.direction !== direction) {
        $$postMessage({ type: 'turn', direction })
        yield delay(0)
      }
      tank = tank.set('direction', direction)
      const [itemType, aheadLength]: [string, number] = yield* lookAhead(tank)
      console.debug('use-direction:', direction)
      console.log(itemType, aheadLength)
      if (itemType === 'border' || itemType === 'river') {
        // 前方是边界或river
        if (aheadLength < 1) { // 距离很小 转弯
          continue
        } else { // 继续前行
          $$postMessage({ type: 'forward', forwardLength: aheadLength })
        }
      } else if (itemType === 'brick') {
        if (aheadLength < 16) {
          // 发现前方是brick, 且距离较近, 发射子弹
          $$postMessage({ type: 'fire' })
        } else { // 距离较远, 先尝试接近
          $$postMessage({ type: 'forward', forwardLength: aheadLength })
        }
      } else { // steel
        if (aheadLength < 1) {
          continue // 转弯
        } else {
          $$postMessage({ type: 'forward', forwardLength: aheadLength })
        }
      }
      break
    }
  }
}

function* lookAhead(tank: TankRecord) {
  const { map: { bricks, steels, rivers } }: State = yield select()
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

