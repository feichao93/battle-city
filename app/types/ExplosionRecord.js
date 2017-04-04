import { Record } from 'immutable'

const ExplosionRecord = Record({
  explosionId: 0,
  explosionType: '', // bullet | tank
  x: 0,
  y: 0,
})

export default ExplosionRecord
