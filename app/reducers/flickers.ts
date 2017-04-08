import { Map } from 'immutable'
import { FlickerId, FlickerRecord, Action } from 'types'

export type FlickersMap = Map<FlickerId, FlickerRecord>

export default function flickers(state = Map() as FlickersMap, action: Action) {
  if (action.type === 'SPAWN_FLICKER') {
    return state.set(action.flickerId, FlickerRecord(action))
  } else if (action.type === 'REMOVE_FLICKER') {
    return state.delete(action.flickerId)
  } else {
    return state
  }
}
