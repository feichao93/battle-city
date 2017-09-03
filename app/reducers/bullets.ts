import { Map } from 'immutable'
import BulletRecord from 'types/BulletRecord'

export type BulletsMap = Map<BulletId, BulletRecord>

export default function bullets(state = Map() as BulletsMap, action: Action) {
  if (action.type === 'ADD_BULLET') {
    return state.set(action.bullet.bulletId, action.bullet)
  } else if (action.type === 'REMOVE_BULLET') {
    return state.delete(action.bulletId)
  } else if (action.type === 'UPDATE_BULLETS') {
    return state.merge(action.updatedBullets)
  } else {
    return state
  }
}
