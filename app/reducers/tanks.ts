import { Map } from 'immutable'
import { TankRecord } from 'types'

export type TanksMap = Map<TankId, TankRecord>

export default function tanks(state = Map() as TanksMap, action: Action) {
  if (action.type === 'SPAWN_TANK') {
    return state.set(action.tank.tankId, TankRecord(action.tank))
  } else if (action.type === 'MOVE') {
    return state.set(action.tankId, action.tank)
  } else if (action.type === 'START_MOVE') {
    return state.setIn([action.tankId, 'moving'], true)
  } else if (action.type === 'STOP_MOVE') {
    return state.setIn([action.tankId, 'moving'], false)
  } else if (action.type === 'REMOVE_TANK') {
    return state.delete(action.tankId)
  } else {
    return state
  }
}
