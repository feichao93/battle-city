import { Map } from 'immutable'
import * as A from 'utils/actions'
import ExplosionRecord from 'types/ExplosionRecord'

const initialState = Map()

export default function explosions(state = initialState, action) {
  if (action.type === A.SPAWN_EXPLOSION) {
    return state.set(action.explosionId, ExplosionRecord(action))
  } else if (action.type === A.REMOVE_EXPLOSION) {
    return state.delete(action.explosionId)
  } else {
    return state
  }
}
