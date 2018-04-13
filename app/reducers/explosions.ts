import { Map } from 'immutable'
import { ExplosionRecord } from '../types'

export type ExplosionsMap = Map<ExplosionId, ExplosionRecord>

export default function explosions(state = Map() as ExplosionsMap, action: Action) {
  if (action.type === 'ADD_OR_UPDATE_EXPLOSION') {
    return state.set(action.explosion.explosionId, action.explosion)
  } else if (action.type === 'REMOVE_EXPLOSION') {
    return state.delete(action.explosionId)
  } else {
    return state
  }
}
