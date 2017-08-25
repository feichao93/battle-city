import { Record } from 'immutable'

const TankRecord = Record({
  active: true,
  tankId: 0,
  x: 0,
  y: 0,
  side: 'human' as Side,
  direction: 'up' as Direction,
  moving: false,
  level: 'basic' as TankLevel,
  color: 'auto' as TankColor,
  hp: 1,
  withPowerUp: false,

  // helmetDuration用来记录tank的helmet的剩余的持续时间
  helmetDuration: 0,
  // frozenTimeout小于等于0表示可以进行移动, 大于0表示还需要等待frozen毫秒才能进行移动
  frozenTimeout: 0,
  // cooldown小于等于0表示可以进行开火, 大于0表示还需要等待cooldown毫秒才能进行开火
  cooldown: 0,
})

const record = TankRecord()
const plainTankRecord = record.toObject()

type TankRecord = typeof record

export default TankRecord

export type PlainTankRecord = typeof plainTankRecord
