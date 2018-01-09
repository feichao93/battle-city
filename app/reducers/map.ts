import parseStageMap from 'utils/parseStageMap'
import stageConfigs from 'stages'
import { mapRecord } from 'types'

const initState = mapRecord.set('eagle', null)

export default function mapReducer(state = initState, action: Action) {
  if (action.type === 'LOAD_STAGE_MAP') {
    const { name } = action
    return parseStageMap(stageConfigs[name].map)
  } else if (action.type === 'DESTROY_EAGLE') {
    return state.setIn(['eagle', 'broken'], true)
  } else if (action.type === 'REMOVE_BRICKS') {
    return state.update('bricks', bricks =>
      bricks.map((set, t) => (action.ts.has(t) ? false : set)),
    )
  } else if (action.type === 'REMOVE_STEELS') {
    return state.update('steels', steels =>
      steels.map((set, t) => (action.ts.has(t) ? false : set)),
    )
  } else if (action.type === 'UPDATE_MAP') {
    return action.map
  } else if (action.type === 'ADD_RESTRICTED_AREA') {
    return state.update('restrictedAreas', areas => areas.set(action.areaId, action.area))
  } else if (action.type === 'REMOVE_RESTRICTED_AREA') {
    return state.update('restrictedAreas', areas => areas.delete(action.areaId))
  } else {
    return state
  }
}
