import parseStageMap from 'utils/parseStageMap'
import stageConfigs from 'stages'
import { mapRecord } from 'types'

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
