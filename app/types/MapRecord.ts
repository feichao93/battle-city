import { Record, Repeat } from 'immutable'
import { N_MAP } from 'utils/constants'
import { eagleRecord, PlainEagleRecord } from 'types/EagleRecord'

const MapRecord = Record({
  eagle: eagleRecord,
  bricks: Repeat(false, N_MAP.BRICK ** 2).toList(),
  steels: Repeat(false, N_MAP.STEEL ** 2).toList(),
  rivers: Repeat(false, N_MAP.RIVER ** 2).toList(),
  snows: Repeat(false, N_MAP.SNOW ** 2).toList(),
  forests: Repeat(false, N_MAP.FOREST ** 2).toList(),
})

export const mapRecord = MapRecord()
type MapRecord = typeof mapRecord

export default MapRecord

export type PlainMapRecord = {
  eagle: PlainEagleRecord
  bricks: boolean[]
  steels: boolean[]
  rivers: boolean[]
  snows: boolean[]
  forests: boolean[]
}
