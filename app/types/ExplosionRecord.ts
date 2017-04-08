import { Record } from 'immutable'
import { ExplosionId, ExplosionType } from 'types'

type Base = {
  explosionId: ExplosionId,
  explosionType: ExplosionType,
  x: number,
  y: number,
}

type ExplosionRecord = Record.Instance<Base> & Readonly<Base>

const ExplosionRecord = Record({
  explosionId: 0,
  explosionType: 'bullet', // bullet | tank
  x: 0,
  y: 0,
} as Base)

export default ExplosionRecord
