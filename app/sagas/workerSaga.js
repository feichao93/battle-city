import { buffers, eventChannel } from 'redux-saga'
import { fork, take, select, put } from 'redux-saga/effects'
import { LEFT, RIGHT, UP, DOWN } from 'utils/constants'
import directionController from 'sagas/directionController'
import fireController from 'sagas/fireController'
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!ai/worker'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

// 处理worker发送过来的message
function* handleReceiveMessages(channel) {
  let state = { type: 'idle' }
  yield fork(directionController, 'AI', getAIInput)
  yield fork(fireController, 'AI', () => state.fire)

  while (true) {
    const message = yield take(channel)
    console.debug('[saga] receive:', message)
    if (message.type === 'move') {
      const { x, y } = message
      // TODO 检查x,y能否到达
      state = { type: 'move', x, y }
    } else if (message.type === 'idle') {
      state = { type: 'idle' }
    } else if (message.type === 'fire') {
      state.fire = true
    } else {
      throw new Error()
    }
  }

  function* getAIInput() {
    const threshhold = 0.01
    const tank = yield select(selectors.playerTank, 'AI')
    if (tank == null) {
      return null
    }
    if (state.type === 'idle') {
      return null
    } else if (state.type === 'move') {
      const shouldMap = {
        [RIGHT]: tank.x <= state.x - threshhold,
        [LEFT]: tank.x >= state.x + threshhold,
        [DOWN]: tank.y <= state.y - threshhold,
        [UP]: tank.y >= state.y + threshhold,
      }
      const maxDistanceMap = {
        [RIGHT]: state.x - tank.x,
        [LEFT]: tank.x - state.x,
        [DOWN]: state.y - tank.y,
        [UP]: tank.y - state.y,
      }
      for (const direction of [RIGHT, LEFT, DOWN, UP]) {
        if (shouldMap[direction]) {
          if (tank.direction !== direction) {
            return { type: 'turn', direction }
          } else {
            return {
              type: 'forward',
              maxDistance: maxDistanceMap[direction],
            }
          }
        }
      }
    }
    return null
  }
}

function* sendMessages(worker) {
  while (true) {
    const action = yield take(a => a.type !== A.TICK && a.type !== A.AFTER_TICK
    && a.type !== A.MOVE && a.type !== A.UPDATE_BULLETS)
    worker.postMessage(JSON.stringify(action))
  }
}

export default function* workerSaga() {
  const worker = new Worker()

  const channel = eventChannel((emmiter) => {
    injectDebugUtils(emmiter)
    worker.addEventListener('message', listener)
    return () => worker.removeEventListener('message', listener)

    function listener(event) {
      emmiter(event.data)
    }
  }, buffers.expanding(16))

  yield fork(handleReceiveMessages, channel)
  // yield fork(sendMessages, worker)
}

function injectDebugUtils(emmiter) {
  // todo 下面三个函数用来在命令行中测试
  window.go = (x, y) => emmiter({ type: 'move', x, y })
  window.fire = () => emmiter({ type: 'fire' })
  window.idle = () => emmiter({ type: 'idle' })
  setTimeout(() => {
    const arena = document.querySelector('[role=battle-field]')
    arena.addEventListener('click', (event) => {
      const rect = arena.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const flr = xxx => Math.floor(xxx / 8) * 8
      window.go(flr(x - 4), flr(y - 4))
    })
    let firing = false
    arena.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      if (firing) {
        window.idle()
        firing = true
      } else {
        window.fire()
        firing = false
      }
    })
  }, 100)
}
