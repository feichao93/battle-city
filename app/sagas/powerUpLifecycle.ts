import { put, race, select, take } from 'redux-saga/effects'
import { PowerUpRecord, State } from '../types'
import { frame as f } from '../utils/common'
import soundManager from '../utils/soundManager'
import Timing from '../utils/Timing'

function* blink(powerUpId: PowerUpId) {
  while (true) {
    yield Timing.delay(f(8))
    const { powerUps }: State = yield select()
    const powerUp = powerUps.get(powerUpId)
    yield put<Action>({
      type: 'SET_POWER_UP',
      powerUp: powerUp.update('visible', v => !v),
    })
  }
}

/** 一个power-up的生命周期 */
export default function* powerUpLifecycle(powerUp: PowerUpRecord) {
  const pickThisPowerUp = (action: Action) =>
    action.type === 'PICK_POWER_UP' && action.powerUp.powerUpId === powerUp.powerUpId

  try {
    soundManager.powerup_appear()
    yield put<Action>({
      type: 'SET_POWER_UP',
      powerUp,
    })
    const result = yield race({
      cancel: take(['END_STAGE', 'CLEAR_ALL_POWER_UPS']),
      blink: blink(powerUp.powerUpId),
      picked: take(pickThisPowerUp),
    })
    console.log('powerup-result:', result)
    if (result.picked) {
      soundManager.powerup_pick()
    }
  } finally {
    yield put<Action>({
      type: 'REMOVE_POWER_UP',
      powerUpId: powerUp.powerUpId,
    })
  }
}
