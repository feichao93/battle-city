import { Map } from 'immutable'
import { FlickerRecord } from 'types'

export type FlickersMap = Map<FlickerId, FlickerRecord>

export default function flickers(state = Map() as FlickersMap, action: Action) {
  if (action.type === 'ADD_OR_UPDATE_FLICKER') {
    return state.set(action.flicker.flickerId, action.flicker)
  } else if (action.type === 'REMOVE_FLICKER') {
    return state.delete(action.flickerId)
  } else {
    return state
  }
}
