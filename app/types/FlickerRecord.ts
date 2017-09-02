import { Record } from 'immutable'

const FlickerRecord = Record({
  flickerId: 0,
  x: 0,
  y: 0,
  shape: 0 as FlickerShape,
})

const record = FlickerRecord()

type FlickerRecord = typeof record

export default FlickerRecord
