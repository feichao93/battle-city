import { Map } from 'immutable'
import { FlickerRecord } from '../types'
import { A, Action } from '../utils/actions'

export type FlickersMap = Map<FlickerId, FlickerRecord>

export default function flickers(state = Map() as FlickersMap, action: Action) {
  if (action.type === A.SetFlicker) {
    return state.set(action.flicker.flickerId, action.flicker)
  } else if (action.type === A.RemoveFlicker) {
    return state.delete(action.flickerId)
  } else {
    return state
  }
}
