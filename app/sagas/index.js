import { eventChannel } from 'redux-saga'
import { fork, take, put } from 'redux-saga/effects'
import fireController from 'sagas/fireController'
import directionController from 'sagas/directionController'
import bulletsSaga from 'sagas/bulletsSaga'
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

export default function* rootSaga() {
  console.debug('root saga started')
  // 注意各个saga的启动顺序, 这将影响到后续action的put顺序
  yield fork(bulletsSaga)

  yield fork(directionController)
  yield fork(fireController)

  yield fork(function* handleTick() {
    while (true) {
      yield put(yield take(tickChannel))
    }
  })
}
