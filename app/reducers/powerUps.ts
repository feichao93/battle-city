import { Map } from 'immutable'
import { PowerUpRecord } from '../types'
import { A, Action } from '../utils/actions'

export type PowerUpsMap = Map<PowerUpId, PowerUpRecord>

export default function powerUps(state = Map<PowerUpId, PowerUpRecord>(), action: Action) {
  if (action.type === A.SetPowerUp) {
    return state.set(action.powerUp.powerUpId, action.powerUp)
  } else if (action.type === A.RemovePowerUp) {
    return state.delete(action.powerUpId)
  } else {
    return state
  }
}
