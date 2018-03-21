import { eventChannel } from 'redux-saga'
import { takeEvery, select, put, take } from 'redux-saga/effects'
import { State } from 'types'

const Mousetrap = require('mousetrap')

export default function* tickEmitter(maxFPS: number, bindEsc: boolean) {
  const tickChannel = eventChannel<Action.TickAction>(emit => {
    let lastTime = performance.now()
    let requestId = requestAnimationFrame(emitTick)

    function emitTick() {
      const now = performance.now()
      emit({ type: 'TICK', delta: now - lastTime })
      lastTime = now
      requestId = requestAnimationFrame(emitTick)
    }

    return () => cancelAnimationFrame(requestId)
  })

  if (bindEsc) {
    const escChannel = eventChannel(emitter => {
      Mousetrap.bind('esc', emitter)
      return () => Mousetrap.unbind('esc')
    })
    yield takeEvery(escChannel, function* handleESC() {
      const { game: { paused } }: State = yield select()
      if (!paused) {
        yield put<Action>({ type: 'GAMEPAUSE' })
      } else {
        yield put<Action>({ type: 'GAMERESUME' })
      }
    })
  }

  try {
    let accumulation = 0
    while (true) {
      const { delta }: Action.TickAction = yield take(tickChannel)
      const { game: { paused } }: State = yield select()
      if (!paused) {
        accumulation += delta
        if (accumulation > 1000 / maxFPS) {
          yield put<Action.TickAction>({ type: 'TICK', delta: accumulation })
          yield put<Action.AfterTickAction>({ type: 'AFTER_TICK', delta: accumulation })
          accumulation = 0
        }
      }
    }
  } finally {
    tickChannel.close()
  }
}
