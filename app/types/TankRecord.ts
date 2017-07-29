import { Record } from 'immutable'

const TankRecord = Record({
  tankId: 0,
  x: 0,
  y: 0,
  side: 'human' as Side,
  direction: null as Direction,
  moving: false,
  level: 0,
  color: 'green',
  bulletSpeed: 0.12,
  bulletLimit: 2,
  bulletInterval: 200,
})

const record = TankRecord()
type TankRecord = typeof record

export default TankRecord
