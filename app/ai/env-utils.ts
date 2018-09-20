import { List } from 'immutable'
import { MapRecord, TankRecord, TanksMap } from '../types'
import { asRect, getDirectionInfo } from '../utils/common'
import { BLOCK_SIZE, FIELD_SIZE, ITEM_SIZE_MAP, TANK_SIZE } from '../utils/constants'
import IndexHelper from '../utils/IndexHelper'
import { logAhead } from './logger'

/** AI是否可以破坏该障碍物 */
function canDestroy(barrierType: BarrierType) {
  return barrierType === 'brick'
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
  nearestPlayerTank: RelativePosition
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

  getPrimaryDirection(): Direction {
    if (this.absdx > this.absdy) {
      if (this.dx > 0) {
        return 'right'
      } else {
        return 'left'
      }
    } else {
      if (this.dy > 0) {
        return 'down'
      } else {
        return 'up'
      }
    }
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
    } else {
      // direction === 'down'
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
      return 0.1
    } else if (forwardLength <= 6 * BLOCK_SIZE) {
      return 0.6
    }
  },
  playerTank(forwardLength: number) {
    logAhead('player-tank:', forwardLength)
    if (forwardLength < 0) {
      return 0.1
    } else if (forwardLength <= 6 * BLOCK_SIZE) {
      return 0.5
    }
  },
  destroyable(forwardLength: number) {
    logAhead('destroyable:', forwardLength)
    // 随着距离增加fire概率减小; 距离0时, fire 概率最高; 距离 180 时, 不fire
    return 0.6 - forwardLength / 300
  },
  idle() {
    return 0.05
  },
}

/** 获取tank的「环境信息」
 * 包括坦克上下左右四个方向的障碍物信息，以及坦克与最近的 player-tank 相对位置 */
export function getEnv(map: MapRecord, tanks: TanksMap, tank: TankRecord): TankEnv {
  // pos对象用来存放tank与其他物体之间的相对位置
  const pos: TankPosition = {
    eagle: new RelativePosition(tank, map.eagle),
    nearestPlayerTank: null,
  }

  // 计算ai-tank与最近的 player-tank 的相对位置
  const { nearestPlayerTank } = tanks.reduce(
    (reduction, next) => {
      if (next.side === 'player') {
        const distance = Math.abs(next.x - tank.x) + Math.abs(next.y - tank.y)
        if (distance < reduction.minDistance) {
          return { minDistance: distance, nearestPlayerTank: next }
        }
      }
      return reduction
    },
    { minDistance: Infinity, nearestPlayerTank: null as TankRecord },
  )
  if (nearestPlayerTank) {
    pos.nearestPlayerTank = new RelativePosition(tank, nearestPlayerTank)
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
export function determineFire(tank: TankRecord, { barrierInfo, tankPosition: pos }: TankEnv) {
  const random = Math.random()

  const ahead = barrierInfo[tank.direction]
  if (canDestroy(ahead.type)) {
    if (random < FireThreshhold.destroyable(ahead.length)) {
      return true
    }
  }

  // 坦克面向eagle且足够接近时, 增加开火概率
  const eagleForwardInfo = pos.eagle.getForwardInfo(tank.direction)
  if (eagleForwardInfo.offset <= 8) {
    if (random < FireThreshhold.eagle(eagleForwardInfo.length)) {
      return true
    }
  }

  // 坦克面向nearestPlayerTank且足够接近时, 增加开火概率
  if (pos.nearestPlayerTank) {
    const playerTankForwardInfo = pos.nearestPlayerTank.getForwardInfo(tank.direction)
    if (playerTankForwardInfo.offset <= 8) {
      if (random < FireThreshhold.playerTank(playerTankForwardInfo.length)) {
        return true
      }
    }
  }

  return random < FireThreshhold.idle()
}

/** 向前观察，返回前方的障碍物类型与距离 */
function lookAhead({ bricks, steels, rivers }: MapRecord, tank: TankRecord): BarrierInfoEntry {
  const brickAheadLength = getAheadBrickLength(bricks, tank)
  const steelAheadLength = getAheadSteelLength(steels, tank)
  const riverAheadLength = getAheadRiverLength(rivers, tank)
  if (
    steelAheadLength === Infinity &&
    brickAheadLength === Infinity &&
    riverAheadLength === Infinity
  ) {
    let borderAheadLength
    if (tank.direction === 'up') {
      borderAheadLength = tank.y
    } else if (tank.direction === 'down') {
      borderAheadLength = FIELD_SIZE - tank.y - TANK_SIZE
    } else if (tank.direction === 'left') {
      borderAheadLength = tank.x
    } else {
      // RIGHT
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
