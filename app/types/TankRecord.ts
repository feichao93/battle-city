import { Record } from 'immutable'
import { TankId, Side, Direction } from 'types'

type Base = {
  tankId: TankId,
  x: number,
  y: number,
  side: Side,
  direction: Direction,
  moving: boolean,
  level: number,
  color: string,
  bulletSpeed: number,
  bulletLimit: number,
  bulletInterval: number,
}

type TankRecord = Record.Instance<Base> & Readonly<Base>

const TankRecord = Record({
  tankId: 0,
  x: 0,
  y: 0,
  side: 'user',
  direction: null,
  moving: false,
  level: 0,
  color: 'green',
  bulletSpeed: 0.12,
  bulletLimit: 2,
  bulletInterval: 200,
} as Base)

export default TankRecord
