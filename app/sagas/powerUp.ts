import { put, race, take } from 'redux-saga/effects'
import { PowerUpRecord } from 'types'
import { frame as f } from 'utils/common'
import { nonPauseDelay } from 'sagas/common'

export default function* powerUp(powerUp: PowerUpRecord) {
  const pickThisPowerUp = (action: Action) => (
    action.type === 'PICK_POWER_UP'
    && action.powerUp.powerUpId === powerUp.powerUpId
  )

  try {
    yield put<Action>({
      type: 'ADD_POWER_UP',
      powerUp,
    })
    let visible = true
    for (let i = 0; i < 50; i++) {
      const result = yield race({
        timeout: nonPauseDelay(f(8)),
        picked: take(pickThisPowerUp),
        stageChanged: take('START_STAGE'),
      })
      if (result.picked || result.stageChanged) {
        break
      } // else timeout. continue
      visible = !visible
      yield put<Action>({
        type: 'UPDATE_POWER_UP',
        powerUp: powerUp.set('visible', visible),
      })
    }
  } finally {
    yield put<Action>({
      type: 'REMOVE_POWER_UP',
      powerUpId: powerUp.powerUpId,
    })
  }
}
