import { Map } from 'immutable'
import * as A from 'utils/actions'
import TankRecord from 'types/TankRecord'

export default function tanks(state = Map(), action) {
  if (action.type === A.SPAWN_TANK) {
    return state.set(action.tankId, TankRecord(action))
  } else if (action.type === A.MOVE) {
    return state.set(action.tankId, action.tank)
  } else if (action.type === A.START_MOVE) {
    return state.setIn([action.tankId, 'moving'], true)
  } else if (action.type === A.STOP_MOVE) {
    return state.setIn([action.tankId, 'moving'], false)
  } else if (action.type === A.REMOVE_TANK) {
    return state.delete(action.tankId)
  } else {
    return state
  }
}
