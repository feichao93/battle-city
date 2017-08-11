import { Record } from 'immutable'
import { BLOCK_SIZE } from 'utils/constants'

const EagleRecord = Record({
  x: 6 * BLOCK_SIZE,
  y: 12 * BLOCK_SIZE,
  broken: false,
})
export const eagleRecord = EagleRecord()
export const plainEagleRecord = eagleRecord.toObject()

export type PlainEagleRecord = typeof plainEagleRecord
type EagleRecord = typeof eagleRecord

export default EagleRecord
