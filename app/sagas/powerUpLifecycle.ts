import { select, put, race, take } from 'redux-saga/effects'
import { PowerUpRecord, State } from 'types'
import { frame as f } from 'utils/common'
import { nonPauseDelay } from 'sagas/common'

function* blink(powerUpId: PowerUpId) {
  while (true) {
    yield nonPauseDelay(f(8))
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
    yield put<Action>({
      type: 'SET_POWER_UP',
      powerUp,
    })
    yield race<any>([
      take(pickThisPowerUp),
      take('START_STAGE'),
      take('CLEAR_ALL_POWER_UPS'),
      blink(powerUp.powerUpId),
    ])
  } finally {
    yield put<Action>({
      type: 'REMOVE_POWER_UP',
      powerUpId: powerUp.powerUpId,
    })
  }
}
