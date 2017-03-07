import { Map } from 'immutable'
import * as A from 'utils/actions'
import FlickerRecord from 'types/FlickerRecord'

const initialState = Map()

export default function flickers(state = initialState, action) {
  if (action.type === A.SPAWN_FLICKER) {
    return state.set(action.flickerId, FlickerRecord(action))
  } else if (action.type === A.REMOVE_FLICKER) {
    return state.delete(action.flickerId)
  } else {
    return state
  }
}
