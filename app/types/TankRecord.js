import { Record } from 'immutable'

const TankRecord = Record({
  tankId: 0,
  x: 0,
  y: 0,
  direction: null,
  moving: false,
  level: 0,
  color: 'green',
})

export default TankRecord
