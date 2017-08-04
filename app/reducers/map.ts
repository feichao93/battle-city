import { Record, Repeat } from 'immutable'
import { BLOCK_SIZE, N_MAP } from 'utils/constants'
import parseStageMap from 'utils/parseStageMap'
import stageConfigs from 'stages'

export const EagleRecord = Record({
  x: 6 * BLOCK_SIZE,
  y: 12 * BLOCK_SIZE,
  broken: false,
})
const eagleRecord = EagleRecord()
export type EagleRecord = typeof eagleRecord

export const MapRecord = Record({
  eagle: eagleRecord,
  bricks: Repeat(false, N_MAP.BRICK ** 2).toList(),
  steels: Repeat(false, N_MAP.STEEL ** 2).toList(),
  rivers: Repeat(false, N_MAP.RIVER ** 2).toList(),
  snows: Repeat(false, N_MAP.SNOW ** 2).toList(),
  forests: Repeat(false, N_MAP.FOREST ** 2).toList(),
})

const mapRecord = MapRecord()
export type MapRecord = typeof mapRecord

export default function mapReducer(state = mapRecord, action: Action) {
  if (action.type === 'LOAD_STAGE') {
    const { name } = action
    return parseStageMap(stageConfigs[name].map)
  } else if (action.type === 'DESTROY_EAGLE') {
    return state.setIn(['eagle', 'broken'], true)
  } else if (action.type === 'DESTROY_BRICKS') {
    return state.update('bricks', bricks => (
      bricks.map((set, t) => (action.ts.has(t) ? false : set)))
    )
  } else if (action.type === 'DESTROY_STEELS') {
    return state.update('steels', steels => (
      steels.map((set, t) => (action.ts.has(t) ? false : set)))
    )
  } else {
    return state
  }
}
