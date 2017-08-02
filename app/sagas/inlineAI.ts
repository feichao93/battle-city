import { List } from 'immutable'
import { Channel, delay } from 'redux-saga'
import { call, fork, race, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE, FIELD_SIZE, ITEM_SIZE_MAP, N_MAP, TANK_SIZE } from 'utils/constants'
import { asBox, getDirectionInfo, iterRowsAndCols, reverseDirection } from 'utils/common'
import * as selectors from 'utils/selectors'
import { State, TankRecord } from 'types'

// const log = console.log
// const table = console.table
const log: any = () => 0
const table: any = () => 0

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

interface TankPosition {
  eagle: Vector
  nearestHumanTank: Vector
}

interface TankEnv {
  tankPosition: TankPosition
  barrierInfo: BarrierInfo
}

type BarrierType = 'border' | 'steel' | 'river' | 'brick'

// 内联的AI. 用于测试开发
// todo 转向与开火的概率有点问题, 需要仔细check一下
export default function* inlineAI(playerName: string,
                                  postMessage: (command: AICommand) => void,
                                  noteChannel: Channel<any>) {
  while (true) {
    const raceResult = yield race({
      timeout: call(delay, 2000),
      note: take(noteChannel),
    })
    // console.groupCollapsed(`AI ${playerName}`)
    // console.log(raceResult)
    let tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank == null) {
      // console.groupEnd()
      continue
    }

    const env = getEnv(yield select(), tank)
    const priorityMap = calculatePriorityMap(env)

    // 降低回头的优先级
    const reverse = reverseDirection(tank.direction)
    priorityMap[reverse] = Math.min(priorityMap[reverse], 1)

    const nextDirection = getRandomDirection(priorityMap)

    log('binfo', env.barrierInfo)
    log('pos', env.tankPosition)
    log('priority-map', priorityMap)
    log('next-direction', nextDirection)

    if (tank.direction !== nextDirection) {
      postMessage({ type: 'turn', direction: nextDirection })
      tank = tank.set('direction', nextDirection)
      // 等待足够长的时间, 保证turn命令已经被处理
      yield delay(100)
    }

    if (shouldFire(tank, env)) {
      log('command fire!')
      postMessage({ type: 'fire' })
    }

    log('forward-length:', env.barrierInfo[tank.direction].length)
    postMessage({
      type: 'forward',
      // todo tank应该更加偏向于走到下一个 *路口*
      // forwardLength: Math.max(BLOCK_SIZE, env.barrierInfo[tank.direction].length),
      forwardLength: env.barrierInfo[tank.direction].length,
    })
    // $$postMessage({ type: 'fire', forwardLength: 3 * BLOCK_SIZE })
    // console.groupEnd()
  }
}

function calculatePriorityMap({ tankPosition: pos, barrierInfo: binfo }: TankEnv): PriorityMap {
  const priorityMap: PriorityMap = {
    up: 2,
    down: 2,
    left: 2,
    right: 2,
  }

  // 计算往下走的优先级
  if (pos.eagle.dy >= 4 * BLOCK_SIZE) {
    priorityMap.down += 2
  } else if (pos.eagle.dy >= 2 * BLOCK_SIZE) {
    priorityMap.down += 1
  }
  // if (binfo.down.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.down.type)) {
  //   priorityMap.down = 1
  // }
  if (binfo.down.length < 4 && !canDestroy(binfo.down.type)) {
    priorityMap.down = 0
  }

  // 计算往上走的优先级
  if (pos.eagle.dy <= -4 * BLOCK_SIZE) {
    priorityMap.up += 2
  } else if (pos.eagle.dy < -2 * BLOCK_SIZE) {
    priorityMap.up += 1
  }
  // if (binfo.up.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.up.type)) {
  //   priorityMap.up = 1
  // }
  if (binfo.up.length < 4 && !canDestroy(binfo.up.type)) {
    priorityMap.up = 0
  }

  // 计算往左走的优先级
  if (pos.eagle.dx <= -4 * BLOCK_SIZE) {
    priorityMap.left += 2
  } else if (pos.eagle.dx <= -2 * BLOCK_SIZE) {
    priorityMap.left += 1
  }
  // if (binfo.left.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.left.type)) {
  //   priorityMap.left = 1
  // }
  if (binfo.left.length < 4 && !canDestroy(binfo.left.type)) {
    priorityMap.left = 0
  }

  // 计算往右走的优先级
  if (pos.eagle.dx >= 4 * BLOCK_SIZE) {
    priorityMap.right += 2
  } else if (pos.eagle.dx >= 2 * BLOCK_SIZE) {
    priorityMap.right += 1
  }
  // if (binfo.right.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.right.type)) {
  //   priorityMap.right = 1
  // }
  if (binfo.right.length < 4 && !canDestroy(binfo.right.type)) {
    priorityMap.right = 0
  }

  return priorityMap
}

// 获取tank的环境信息
function getEnv(state: State, tank: TankRecord): TankEnv {
  // pos对象用来存放tank与其他物体之间的相对位置
  const pos = {
    eagle: {},
    nearestHumanTank: {},
  } as TankPosition

  // 计算tank与eagle的相对位置
  const { map: { eagle }, tanks } = state
  pos.eagle.dx = eagle.y - tank.y
  pos.eagle.dy = eagle.x - tank.x

  // 计算ai-tank与最近的human-tank的相对位置
  const { nearestHumanTank } = tanks.reduce((reduction, next) => {
    if (next.side === 'human') {
      const distance = Math.abs(next.x - tank.x) + Math.abs(next.y - tank.y)
      if (distance < reduction.minDistance) {
        return { minDistance: distance, nearestHumanTank: next }
      }
    }
    return reduction
  }, { minDistance: Infinity, nearestHumanTank: null as TankRecord })
  if (nearestHumanTank) {
    pos.nearestHumanTank.dx = tank.x - nearestHumanTank.x
    pos.nearestHumanTank.dy = tank.y - nearestHumanTank.y
  } else {
    pos.nearestHumanTank = null
  }

  // 障碍物信息
  const binfo: BarrierInfo = {
    down: lookAhead(state, tank.set('direction', 'down')),
    right: lookAhead(state, tank.set('direction', 'right')),
    left: lookAhead(state, tank.set('direction', 'left')),
    up: lookAhead(state, tank.set('direction', 'up')),
  }

  return {
    tankPosition: pos,
    barrierInfo: binfo,
  }
}

function shouldFire(tank: TankRecord, { barrierInfo, tankPosition }: TankEnv) {
  const random = Math.random()

  const ahead = barrierInfo[tank.direction]
  if (canDestroy(ahead.type)) {
    // 随着距离增加fire概率减小; 距离0时, 一定fire; 距离10*BLOCK_SIZE时, 不fire
    const threshhold = 1 - ahead.length / 10 * BLOCK_SIZE
    if (random < threshhold) {
      return true
    }
  }

  // 坦克面向eagle且足够接近时, 增加开火概率
  if (tank.direction === 'left'
    && tankPosition.eagle.dy <= 4
    && -4 * BLOCK_SIZE <= tankPosition.eagle.dx && tankPosition.eagle.dx <= 0) {
    if (random < 0.8) {
      return true
    }
  }
  if (tank.direction === 'right'
    && tankPosition.eagle.dy <= 4
    && 0 <= tankPosition.eagle.dx && tankPosition.eagle.dx <= 4 * BLOCK_SIZE) {
    if (random < 0.8) {
      return true
    }
  }
  if (tank.direction === 'down'
    && tankPosition.eagle.dx <= 4
    && 0 <= tankPosition.eagle.dy && tankPosition.eagle.dy <= 4 * BLOCK_SIZE) {
    if (random < 0.8) {
      return true
    }
  }

  // 坦克面向nearestHumanTank且足够接近时, 增加开火概率
  if (tankPosition.nearestHumanTank) {
    if (tank.direction === 'left'
      && tankPosition.nearestHumanTank.dy <= 4
      && -4 * BLOCK_SIZE <= tankPosition.nearestHumanTank.dx && tankPosition.nearestHumanTank.dx <= 0) {
      if (random < 0.6) {
        return true
      }
    }
    if (tank.direction === 'right'
      && tankPosition.nearestHumanTank.dy <= 4
      && 0 <= tankPosition.nearestHumanTank.dx && tankPosition.nearestHumanTank.dx <= 4 * BLOCK_SIZE) {
      if (random < 0.6) {
        return true
      }
    }
    if (tank.direction === 'up'
      && tankPosition.nearestHumanTank.dx <= 4
      && -4 * BLOCK_SIZE <= tankPosition.nearestHumanTank.dy && tankPosition.nearestHumanTank.dy <= 0) {
      if (random < 0.6) {
        return true
      }
    }
    if (tank.direction === 'down'
      && tankPosition.nearestHumanTank.dx <= 4
      && 0 <= tankPosition.nearestHumanTank.dy && tankPosition.nearestHumanTank.dy <= 4 * BLOCK_SIZE) {
      if (random < 0.6) {
        return true
      }
    }
  }

  return false
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

function lookAhead({ map: { bricks, steels, rivers } }: State, tank: TankRecord): BarrierInfoEntry {
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
    return { type: 'border', length: borderAheadLength }
  } else if (steelAheadLength <= brickAheadLength && steelAheadLength <= riverAheadLength) {
    return { type: 'border', length: steelAheadLength }
  } else if (riverAheadLength <= brickAheadLength) {
    return { type: 'river', length: riverAheadLength }
  } else {
    return { type: 'brick', length: brickAheadLength }
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
