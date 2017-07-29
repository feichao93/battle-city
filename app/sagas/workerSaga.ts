import { buffers, channel as makeChannel, eventChannel, Channel } from 'redux-saga'
import { fork, put, select, take } from 'redux-saga/effects'
import { getDirectionInfo, spawnTank } from 'utils/common'
import directionController from 'sagas/directionController'
import fireController from 'sagas/fireController'
import * as selectors from 'utils/selectors'
import inlineAI from './inlineAI'

const Worker = require('worker-loader!ai/worker')

// 处理worker发送过来的message
function* handleReceiveMessages(channel: Channel<AICommand>, notifyAI: Function) {
  let fire = false
  let nextDirection: Direction = null
  let forwardLength = 0
  let startPos: number

  yield fork(directionController, 'AI', getAIInput)
  yield fork(fireController, 'AI', () => {
    if (fire) {
      fire = false
      return true
    } else {
      return false
    }
  })
  yield fork(function* notifyWhenBulletComplete() {
    while (true) {
      const { bullets }: Action.DestroyBulletsAction = yield take('DESTROY_BULLETS')
      const tank = yield select(selectors.playerTank, 'AI')
      if (tank != null) {
        if (bullets.some(b => (b.tankId === tank.tankId))) {
          console.debug('bullet-completed. notify')
          notifyAI()
        }
      }
    }
  })

  while (true) {
    const command: AICommand = yield take(channel)
    // console.log('[saga] receive:', command)
    if (command.type === 'forward') {
      const tank = yield select(selectors.playerTank, 'AI')
      if (tank == null) {
        continue
      }
      const { xy } = getDirectionInfo(tank.direction)
      startPos = tank.get(xy)
      forwardLength = command.forwardLength
    } else if (command.type === 'fire') {
      fire = true
    } else if (command.type === 'turn') {
      nextDirection = command.direction
    } else if (command.type === 'spawn-tank') {
      const { x, y } = command
      yield put({ type: 'DECREMENT_ENEMY_COUNT' })
      // todo 检查x,y是否被占用
      const tankId = yield* spawnTank({ x, y, side: 'ai' })
      yield put({
        type: 'ACTIVATE_PLAYER',
        playerName: 'AI',
        tankId,
      })
    } else {
      throw new Error()
    }
  }

  function* getAIInput() {
    const tank = yield select(selectors.playerTank, 'AI')
    if (tank == null) {
      return null
    }
    // fixme 转向的时候会将当前前进的信息清除, 导致转向命令和前进命令不能共存
    if (nextDirection && tank.direction !== nextDirection) {
      const direction = nextDirection
      nextDirection = null
      forwardLength = 0
      return { type: 'turn', direction }
    } else if (forwardLength > 0) {
      const { xy } = getDirectionInfo(tank.direction)
      const movedLength = Math.abs(tank.get(xy) - startPos)
      const maxDistance = forwardLength - movedLength
      if (movedLength === forwardLength) {
        forwardLength = 0
        notifyAI()
        return null
      } else {
        return {
          type: 'forward',
          maxDistance,
        }
      }
    }
    return null
  }
}

function* sendMessages(worker: Worker) {
  while (true) {
    const action = yield take((action: Action) => (
      action.type !== 'TICK'
      && action.type !== 'AFTER_TICK'
      && action.type !== 'MOVE'
      && action.type !== 'UPDATE_BULLETS')
    )
    worker.postMessage(JSON.stringify(action))
  }
}

export default function* workerSaga() {
  const inputChannel = makeChannel()
  const worker = new Worker()

  const channel = eventChannel<AICommand>((emmiter) => {
    // injectDebugUtils(emmiter)
    window.$$postMessage = emmiter
    worker.addEventListener('message', listener)
    return () => worker.removeEventListener('message', listener)

    function listener(event: MessageEvent) {
      emmiter(event.data)
    }
  }, buffers.expanding(16))

  yield fork(handleReceiveMessages, channel, () => inputChannel.put('!'))
  // yield fork(sendMessages, worker)
  // 内联的AI. 用于测试开发
  yield fork(inlineAI, window.$$postMessage, inputChannel)
}

declare global {
  interface Window {
    go: any
    fire: any
    idle: any
    $$postMessage: any
  }
}

function injectDebugUtils(emmiter: any) {
  // todo 下面三个函数用来在命令行中测试
  window.go = (x: number, y: number) => emmiter({ type: 'move', x, y })
  window.fire = () => emmiter({ type: 'fire' })
  window.idle = () => emmiter({ type: 'idle' })
  setTimeout(() => {
    const arena = document.querySelector('[role=battle-field]')
    arena.addEventListener('click', (event: MouseEvent) => {
      const rect = arena.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const flr = (xxx: number) => Math.floor(xxx / 8) * 8
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
