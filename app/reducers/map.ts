import { MapRecord } from '../types'
import { A, Action } from '../utils/actions'

const initState = new MapRecord({ eagle: null })

export default function mapReducer(state = initState, action: Action) {
  if (action.type === A.LoadStageMap) {
    return action.stage.map
  } else if (action.type === A.DestroyEagle) {
    return state.setIn(['eagle', 'broken'], true)
  } else if (action.type === A.RemoveBricks) {
    return state.update('bricks', bricks =>
      bricks.map((set, t) => (action.ts.has(t) ? false : set)),
    )
  } else if (action.type === A.RemoveSteels) {
    return state.update('steels', steels =>
      steels.map((set, t) => (action.ts.has(t) ? false : set)),
    )
  } else if (action.type === A.UpdateMap) {
    return action.map
  } else if (action.type === A.AddRestrictedArea) {
    return state.update('restrictedAreas', areas => areas.set(action.areaId, action.area))
  } else if (action.type === A.RemoveRestrictedArea) {
    return state.update('restrictedAreas', areas => areas.delete(action.areaId))
  } else {
    return state
  }
}
