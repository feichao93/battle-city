import { takeEvery, delay, eventChannel } from 'redux-saga'
import { fork, take, put } from 'redux-saga/effects'
import playerController from 'sagas/playerController'
import bulletsSaga from 'sagas/bulletsSaga'
import gameManager from 'sagas/gameManager'
import { CONTROL_CONFIG, TANK_SPAWN_DELAY } from 'utils/constants'
import * as A from 'utils/actions'

const tickChannel = eventChannel((emit) => {
  let lastTime = performance.now()
  let requestId = requestAnimationFrame(emitTick)

  function emitTick() {
    const now = performance.now()
    emit({ type: A.TICK, delta: now - lastTime })
    emit({ type: A.AFTER_TICK, delta: now - lastTime })
    lastTime = now
    requestId = requestAnimationFrame(emitTick)
  }

  return () => {
    cancelAnimationFrame(requestId)
  }
})

function* autoRemoveEffects() {
  yield takeEvery(A.SPAWN_EXPLOSION, function* removeExplosion({ explosionId }) {
    yield delay(200)
    yield put({ type: A.REMOVE_EXPLOSION, explosionId })
  })
  yield takeEvery(A.SPAWN_FLICKER, function* removeFlicker({ flickerId }) {
    yield delay(TANK_SPAWN_DELAY)
    yield put({ type: A.REMOVE_FLICKER, flickerId })
  })
}

export default function* rootSaga() {
  console.debug('root saga started')
  yield fork(function* handleTick() {
    while (true) {
      yield put(yield take(tickChannel))
    }
  })

  // 注意各个saga的启动顺序, 这将影响到后续action的put顺序
  yield fork(bulletsSaga)
  yield fork(autoRemoveEffects)

  yield fork(gameManager)

  yield fork(playerController, 'player-1', CONTROL_CONFIG.player1)
  yield fork(playerController, 'player-2', CONTROL_CONFIG.player2)
}
