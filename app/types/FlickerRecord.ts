import { Record } from 'immutable'

const FlickerRecordBase = Record({
  flickerId: 0,
  x: 0,
  y: 0,
  shape: 0 as FlickerShape,
})

export default class FlickerRecord extends FlickerRecordBase {
  static fromJS(object: any) {
    return new FlickerRecord(object)
  }
}
