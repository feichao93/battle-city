import { Map } from 'immutable'
import { TankRecord } from 'types'
import { incTankLevel } from 'utils/common'

export type TanksMap = Map<TankId, TankRecord>

export default function tanks(state = Map() as TanksMap, action: Action) {
  if (action.type === 'ADD_TANK') {
    return state.set(action.tank.tankId, TankRecord(action.tank))
  } else if (action.type === 'HURT') {
    const tankId = action.targetTank.tankId
    return state.update(tankId, t => t.update('hp', hp => hp - action.hurt))
  } else if (action.type === 'CLEAR_TANKS') {
    return state.clear()
  } else if (action.type === 'MOVE') {
    return state.set(action.tank.tankId, action.tank)
  } else if (action.type === 'START_MOVE') {
    return state.setIn([action.tankId, 'moving'], true)
  } else if (action.type === 'STOP_MOVE') {
    return state.setIn([action.tankId, 'moving'], false)
  } else if (action.type === 'UPGRADE_TANK') {
    // todo 当tank.level已经是armor 该怎么办?
    return state.update(action.tankId, incTankLevel)
  } else if (action.type === 'REMOVE_TANK') {
    // 不能在关卡进行过程中移除tank, 因为tank的子弹可能正在飞行
    // 防御式编程: tank设置为inactive的时候重置一些状态
    return state.update(action.tankId, tank => tank.merge({
      active: false,
      cooldown: 0,
      frozenTimeout: 0,
      helmetDuration: 0,
      moving: false,
      withPowerUp: false,
    }))
  } else if (action.type === 'SET_COOLDOWN') {
    return state.update(action.tankId, tank => tank.set('cooldown', action.cooldown))
  } else if (action.type === 'SET_AI_FROZEN_TIMEOUT') {
    return state.map(tank =>
      tank.side === 'ai' ? tank.set('moving', false) : tank
    )
  } else if (action.type === 'SET_FROZEN_TIMEOUT') {
    return state.update(action.tankId, tank =>
      tank.set('frozenTimeout', action.frozenTimeout)
        // 如果tank从'自由'变为'冰冻', 那么将moving设置为false, 否则保持原样
        .set('moving', (tank.frozenTimeout <= 0 && action.frozenTimeout > 0) && tank.moving))
  } else if (action.type === 'SET_HELMET_DURATION') {
    return state.update(action.tankId,
      tank => tank.set('helmetDuration', Math.max(0, action.duration)))
  } else {
    return state
  }
}
