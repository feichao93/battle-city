import { Map } from 'immutable'
import { PowerUpRecord } from '../types'

export type PowerUpsMap = Map<PowerUpId, PowerUpRecord>

export default function powerUps(state = Map<PowerUpId, PowerUpRecord>(), action: Action) {
  if (action.type === 'SET_POWER_UP') {
    return state.set(action.powerUp.powerUpId, action.powerUp)
  } else if (action.type === 'REMOVE_POWER_UP') {
    return state.delete(action.powerUpId)
  } else {
    return state
  }
}
