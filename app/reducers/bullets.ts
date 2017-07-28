import { Map } from 'immutable'
import BulletRecord from 'types/BulletRecord'

export type BulletsMap = Map<BulletId, BulletRecord>

export default function bullets(state = Map() as BulletsMap, action: Action) {
  if (action.type === 'ADD_BULLET') {
    return state.set(action.bulletId, BulletRecord(action))
  } else if (action.type === 'DESTROY_BULLETS') {
    const set = action.bullets.toSet()
    return state.filterNot(bullet => set.has(bullet))
  } else if (action.type === 'UPDATE_BULLETS') {
    return state.merge(action.updatedBullets)
  } else {
    return state
  }
}
