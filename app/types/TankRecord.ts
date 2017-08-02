import { Record } from 'immutable'

const TankRecord = Record({
  tankId: 0,
  x: 0,
  y: 0,
  side: 'human' as Side,
  direction: 'up' as Direction,
  moving: false,
  level: 'basic' as TankLevel,
  color: 'auto' as TankColor,
  bulletSpeed: 0.12,
  bulletLimit: 2,
  bulletInterval: 200,
  hp: 1,
  withPowerUp: false,
})

const record = TankRecord()
type TankRecord = typeof record

export default TankRecord
