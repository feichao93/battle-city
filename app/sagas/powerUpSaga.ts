import { Task } from 'redux-saga'
import { fork, put, race, take } from 'redux-saga/effects'
import { PowerUpRecord } from 'types'
import { frame as f } from 'utils/common'
import { nonPauseDelay } from 'sagas/common'

function* blink(powerUp: PowerUpRecord) {
  let visible = true
  while (true) {
    yield nonPauseDelay(f(8))
    visible = !visible
    yield put<Action>({
      type: 'ADD_OR_UPDATE_POWER_UP',
      powerUp: powerUp.set('visible', visible)
    })
  }
}

export default function* powerUpSaga(powerUp: PowerUpRecord) {
  const pickThisPowerUp = (action: Action) => (
    action.type === 'PICK_POWER_UP'
    && action.powerUp.powerUpId === powerUp.powerUpId
  )

  const blinkTask: Task = yield fork(blink, powerUp)

  yield put<Action>({
    type: 'ADD_OR_UPDATE_POWER_UP',
    powerUp,
  })
  yield race({
    picked: take(pickThisPowerUp),
    stageChanged: take('START_STAGE'),
  })
  blinkTask.cancel()
  yield put<Action>({
    type: 'REMOVE_POWER_UP',
    powerUpId: powerUp.powerUpId,
  })
}
