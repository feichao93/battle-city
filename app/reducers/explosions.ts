import { Map } from 'immutable'
import { ExplosionRecord } from '../types'
import { A, Action } from '../utils/actions'

export type ExplosionsMap = Map<ExplosionId, ExplosionRecord>

export default function explosions(state = Map() as ExplosionsMap, action: Action) {
  if (action.type === A.SetExplosion) {
    return state.set(action.explosion.explosionId, action.explosion)
  } else if (action.type === A.RemoveExplosion) {
    return state.delete(action.explosionId)
  } else {
    return state
  }
}
