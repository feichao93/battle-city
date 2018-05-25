import { eventChannel, put, select, take, takeEvery } from 'little-saga/compat'
import { State } from '../types'

export interface TickEmitterOptions {
  maxFPS?: number
  bindESC?: boolean
  slow?: number
}

export default function* tickEmitter(options: TickEmitterOptions = {}) {
  const { bindESC = false, slow = 1, maxFPS = Infinity } = options
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

  if (bindESC) {
    const escChannel = eventChannel(emitter => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          emitter('Escape')
        }
      }
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
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
          yield put<Action.TickAction>({ type: 'TICK', delta: accumulation / slow })
          yield put<Action.AfterTickAction>({
            type: 'AFTER_TICK',
            delta: accumulation / slow,
          })
          accumulation = 0
        }
      }
    }
  } finally {
    tickChannel.close()
  }
}
