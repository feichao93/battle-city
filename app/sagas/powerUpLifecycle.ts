import { put, race, select, take } from 'redux-saga/effects'
import { PowerUpRecord, State } from '../types'
import * as actions from '../utils/actions'
import { A, Action } from '../utils/actions'
import { frame as f } from '../utils/common'
import Timing from '../utils/Timing'

function* blink(powerUpId: PowerUpId) {
  while (true) {
    yield Timing.delay(f(8))
    const { powerUps }: State = yield select()
    const powerUp = powerUps.get(powerUpId)
    yield put(actions.setPowerUp(powerUp.update('visible', v => !v)))
  }
}

/** 一个power-up的生命周期 */
export default function* powerUpLifecycle(powerUp: PowerUpRecord) {
  const pickThisPowerUp = (action: Action) =>
    action.type === A.PickPowerUp && action.powerUp.powerUpId === powerUp.powerUpId

  try {
    yield put(actions.playSound('powerup_appear'))
    yield put(actions.setPowerUp(powerUp))
    const result = yield race({
      cancel: take([A.EndStage, A.ClearAllPowerUps]),
      blink: blink(powerUp.powerUpId),
      picked: take(pickThisPowerUp),
    })
    if (result.picked) {
      yield put(actions.playSound('powerup_pick'))
    }
  } finally {
    yield put(actions.removePowerUp(powerUp.powerUpId))
  }
}
