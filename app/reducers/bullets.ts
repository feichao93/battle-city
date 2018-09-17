import { Map } from 'immutable'
import BulletRecord from '../types/BulletRecord'
import { A, Action } from '../utils/actions'

export type BulletsMap = Map<BulletId, BulletRecord>

export default function bullets(state = Map() as BulletsMap, action: Action): BulletsMap {
  if (action.type === A.AddBullet) {
    return state.set(action.bullet.bulletId, action.bullet)
  } else if (action.type === A.RemoveBullet) {
    return state.delete(action.bulletId)
  } else if (action.type === A.UpdateBullets) {
    return state.merge(action.updatedBullets)
  } else if (action.type === A.ClearBullets) {
    return state.clear()
  } else {
    return state
  }
}
