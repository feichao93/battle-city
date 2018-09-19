import ReactDOM from 'react-dom'
import { eventChannel, EventChannel } from 'redux-saga'
import { put, select, take, takeEvery } from 'redux-saga/effects'
import { State } from '../types'
import * as actions from '../utils/actions'

export interface TickEmitterOptions {
  maxFPS?: number
  bindESC?: boolean
  slow?: number
}

export default function* tickEmitter(options: TickEmitterOptions = {}) {
  const { bindESC = false, slow = 1, maxFPS = Infinity } = options
  let escChannel: EventChannel<'Escape'>
  const tickChannel = eventChannel<actions.Tick>(emit => {
    let lastTime = performance.now()
    let requestId = requestAnimationFrame(emitTick)

    function emitTick() {
      const now = performance.now()
      ReactDOM.unstable_batchedUpdates(emit, actions.tick(now - lastTime))
      lastTime = now
      requestId = requestAnimationFrame(emitTick)
    }

    return () => cancelAnimationFrame(requestId)
  })

  if (bindESC) {
    escChannel = eventChannel(emitter => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          emitter('Escape')
        }
      }
      document.addEventListener('keydown', onKeyDown)
      return () => {
        document.removeEventListener('keydown', onKeyDown)
      }
    })
    yield takeEvery(escChannel, function* handleESC() {
      const {
        game: { paused },
      }: State = yield select()
      yield put(actions.playSound('pause'))
      if (!paused) {
        yield put(actions.gamePause())
      } else {
        yield put(actions.gameResume())
      }
    })
  }

  try {
    let accumulation = 0
    while (true) {
      const { delta }: actions.Tick = yield take(tickChannel)
      const {
        game: { paused },
      }: State = yield select()
      if (!paused) {
        accumulation += delta
        if (accumulation > 1000 / maxFPS) {
          yield put(actions.tick(accumulation / slow))
          yield put(actions.afterTick(accumulation / slow))
          accumulation = 0
        }
      }
    }
  } finally {
    tickChannel.close()
    if (escChannel) {
      escChannel.close()
    }
  }
}
