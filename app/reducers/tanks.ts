import { Map } from 'immutable'
import { TankRecord } from 'types'

export type TanksMap = Map<TankId, TankRecord>

export default function tanks(state = Map() as TanksMap, action: Action) {
  if (action.type === 'SPAWN_TANK') {
    return state.set(action.tank.tankId, TankRecord(action.tank))
  } else if (action.type === 'HURT') {
    const tankId = action.targetTank.tankId
    return state.update(tankId, t => t.update('hp', hp => hp - action.hurt))
  } else if (action.type === 'LOAD_STAGE') {
    return state.clear()
  } else if (action.type === 'MOVE') {
    return state.set(action.tankId, action.tank)
  } else if (action.type === 'START_MOVE') {
    return state.setIn([action.tankId, 'moving'], true)
  } else if (action.type === 'STOP_MOVE') {
    return state.setIn([action.tankId, 'moving'], false)
  } else if (action.type === 'REMOVE_TANK') {
    return state.delete(action.tankId)
  } else if (action.type === 'SET_COOLDOWN') {
    return state.update(action.tankId, tank => tank.set('cooldown', action.cooldown))
  } else if (action.type === 'SET_FROZEN_TIMEOUT') {
    return state.update(action.tankId, tank =>
      tank.set('frozenTimeout', action.frozenTimeout)
        .set('moving', (tank.frozenTimeout <= 0 && action.frozenTimeout > 0) && tank.moving))
  } else {
    return state
  }
}
