import { List } from 'immutable'
import { MapRecord, TankRecord, TanksMap } from 'types'
import { BLOCK_SIZE, FIELD_SIZE, ITEM_SIZE_MAP, TANK_SIZE } from 'utils/constants'
import { asRect, getDirectionInfo } from 'utils/common'
import IndexHelper from 'utils/IndexHelper'

const logAhead = (...args: any[]) => 0 /* console.log('[ahead]', ...args) */

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
  eagle: RelativePosition
  nearestHumanTank: RelativePosition
}

interface TankEnv {
  tankPosition: TankPosition
  barrierInfo: BarrierInfo
}

type BarrierType = 'border' | 'steel' | 'river' | 'brick'

export class RelativePosition {
  readonly subject: Point
  readonly object: Point
  readonly dx: number
  readonly dy: number
  readonly absdx: number
  readonly absdy: number

  constructor(subject: Point, object: Point) {
    this.subject = subject
    this.object = object
    this.dx = object.x - subject.x
    this.dy = object.y - subject.y
    this.absdx = Math.abs(this.dx)
    this.absdy = Math.abs(this.dy)
  }

  getForwardInfo(direction: Direction) {
    if (direction === 'left') {
      return {
        length: -this.dx,
        offset: this.absdy,
      }
    } else if (direction === 'right') {
      return {
        length: this.dx,
        offset: this.absdy,
      }
    } else if (direction === 'up') {
      return {
        length: -this.dy,
        offset: this.absdx,
      }
    } else { // direction === 'down'
      return {
        length: this.dy,
        offset: this.absdx,
      }
    }
  }
}

export const FireThreshhold = {
  eagle(forwardLength: number) {
    logAhead('eagle:', forwardLength)
    if (forwardLength < 0) {
      return 0
    } else if (forwardLength <= 4 * BLOCK_SIZE) {
      return 0.8
    }
  },
  humanTank(forwardLength: number) {
    logAhead('human-tank:', forwardLength)
    if (forwardLength < 0) {
      return 0
    } else if (forwardLength <= 4 * BLOCK_SIZE) {
      return 0.6
    }
  },
  destroyable(forwardLength: number) {
    logAhead('destroyable:', forwardLength)
    // 随着距离增加fire概率减小; 距离0时, 一定fire; 距离10*BLOCK_SIZE时, 不fire
    return 1 - forwardLength / 10 * BLOCK_SIZE
  },
  idle() {
    return 0
  },
}


export function calculatePriorityMap({ tankPosition: pos, barrierInfo: binfo }: TankEnv): PriorityMap {
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
export function getEnv(map: MapRecord, tanks: TanksMap, tank: TankRecord): TankEnv {
  // pos对象用来存放tank与其他物体之间的相对位置
  const pos: TankPosition = {
    eagle: new RelativePosition(tank, map.eagle),
    nearestHumanTank: null,
  }

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
    pos.nearestHumanTank = new RelativePosition(tank, nearestHumanTank)
  }

  // 障碍物信息
  const binfo: BarrierInfo = {
    down: lookAhead(map, tank.set('direction', 'down')),
    right: lookAhead(map, tank.set('direction', 'right')),
    left: lookAhead(map, tank.set('direction', 'left')),
    up: lookAhead(map, tank.set('direction', 'up')),
  }

  return {
    tankPosition: pos,
    barrierInfo: binfo,
  }
}

/** 根据目前AI-tank的环境信息, 决定AI-tank是否应该开火 */
export function shouldFire(tank: TankRecord, { barrierInfo, tankPosition: pos }: TankEnv) {
  const random = Math.random()
  // console.log('fire-random:', random)

  // todo 目前部分result的计算是多余的
  let result = false

  const ahead = barrierInfo[tank.direction]
  if (canDestroy(ahead.type)) {
    if (random < FireThreshhold.destroyable(ahead.length)) {
      result = true
    }
  }

  // 坦克面向eagle且足够接近时, 增加开火概率
  const eagleForwardInfo = pos.eagle.getForwardInfo(tank.direction)
  if (eagleForwardInfo.offset <= 8) {
    if (random < FireThreshhold.eagle(eagleForwardInfo.length)) {
      result = true
    }
  }

  // 坦克面向nearestHumanTank且足够接近时, 增加开火概率
  if (pos.nearestHumanTank) {
    const humanTankForwardInfo = pos.nearestHumanTank.getForwardInfo(tank.direction)
    if (humanTankForwardInfo.offset <= 8) {
      if (random < FireThreshhold.humanTank(humanTankForwardInfo.length)) {
        result = true
      }
    }
  }

  if (random < FireThreshhold.idle()) {
    result = true
  }
  return result
}

export function getRandomDirection({ up, down, left, right }: PriorityMap): Direction {
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

function lookAhead({ bricks, steels, rivers }: MapRecord, tank: TankRecord): BarrierInfoEntry {
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
    return { type: 'steel', length: steelAheadLength }
  } else if (riverAheadLength <= brickAheadLength) {
    return { type: 'river', length: riverAheadLength }
  } else {
    return { type: 'brick', length: brickAheadLength }
  }
}

function getAheadBrickLength(bricks: List<boolean>, tank: TankRecord) {
  const size = ITEM_SIZE_MAP.BRICK
  const { xy, updater } = getDirectionInfo(tank.direction)
  let step = 1
  while (true) {
    const iterable = IndexHelper.iter('brick', asRect(tank.update(xy, updater(step * size)), -0.02))
    const array = Array.from(iterable)
    if (array.length === 0) {
      return Infinity
    }
    for (const t of array) {
      if (bricks.get(t)) {
        return (step - 1) * size
      }
    }
    step++
  }
}

function getAheadSteelLength(steels: List<boolean>, tank: TankRecord) {
  const size = ITEM_SIZE_MAP.STEEL
  const { xy, updater } = getDirectionInfo(tank.direction)
  let step = 1
  while (true) {
    const iterable = IndexHelper.iter('steel', asRect(tank.update(xy, updater(step * size)), -0.02))
    const array = Array.from(iterable)
    if (array.length === 0) {
      return Infinity
    }
    for (const t of array) {
      if (steels.get(t)) {
        return (step - 1) * size
      }
    }
    step++
  }
}

function getAheadRiverLength(rivers: List<boolean>, tank: TankRecord) {
  const size = ITEM_SIZE_MAP.RIVER
  const { xy, updater } = getDirectionInfo(tank.direction)
  let step = 1
  while (true) {
    const iterable = IndexHelper.iter('river', asRect(tank.update(xy, updater(step * size)), -0.02))
    const array = Array.from(iterable)
    if (array.length === 0) {
      return Infinity
    }
    for (const t of array) {
      if (rivers.get(t)) {
        return (step - 1) * size
      }
    }
    step++
  }
}
