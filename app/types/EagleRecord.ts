import { Record } from 'immutable'
import { BLOCK_SIZE } from '../utils/constants'

const EagleRecordBase = Record({
  x: 6 * BLOCK_SIZE,
  y: 12 * BLOCK_SIZE,
  broken: false,
})

export default class EagleRecord extends EagleRecordBase {
  static fromJS(object: any) {
    return new EagleRecord(object)
  }
}
