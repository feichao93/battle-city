import { List, Map as IMap, Record, Repeat } from 'immutable'
import { N_MAP } from '../utils/constants'
import EagleRecord from './EagleRecord'

const MapRecordBase = Record({
  eagle: new EagleRecord(),
  bricks: Repeat(false, N_MAP.BRICK ** 2).toList(),
  steels: Repeat(false, N_MAP.STEEL ** 2).toList(),
  rivers: Repeat(false, N_MAP.RIVER ** 2).toList(),
  snows: Repeat(false, N_MAP.SNOW ** 2).toList(),
  forests: Repeat(false, N_MAP.FOREST ** 2).toList(),
  restrictedAreas: IMap<AreaId, Rect>(),
})

export default class MapRecord extends MapRecordBase {
  static fromJS(object: any) {
    return new MapRecord(object)
      .update('eagle', EagleRecord.fromJS)
      .update('bricks', List)
      .update('steels', List)
      .update('rivers', List)
      .update('snows', List)
      .update('forests', List)
      .update('restrictedAreas', IMap)
  }
}
