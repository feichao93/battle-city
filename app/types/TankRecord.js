import { Record } from 'immutable'
import { SIDE } from 'utils/constants'

const TankRecord = Record({
  tankId: 0,
  x: 0,
  y: 0,
  side: SIDE.PLAYER,
  direction: null,
  moving: false,
  level: 0,
  color: 'green',
  bulletSpeed: 0.12,
  bulletLimit: 2,
  bulletInterval: 200,
})

export default TankRecord
