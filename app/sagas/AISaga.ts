import { channel as makeChannel, Channel, eventChannel, Task } from 'redux-saga'
import { all, fork, put, select, spawn, take } from 'redux-saga/effects'
import { getDirectionInfo, spawnTank } from 'utils/common'
import directionController from 'sagas/directionController'
import fireController from 'sagas/fireController'
import * as selectors from 'utils/selectors'
import inlineAI from 'sagas/inlineAI'
import { State } from 'reducers/index'
import TankRecord from 'types/TankRecord'

const EmptyWorker = require('worker-loader!ai/emptyWorker')

// 处理worker发送过来的message
function* handleReceiveMessages(playerName: string, commandChannel: Channel<AICommand>, noteChannel: Channel<Note>) {
  let fire = false
  let nextDirection: Direction = null
  let forwardLength = 0
  let startPos: number

  yield fork(directionController, playerName, getAIInput)
  yield fork(fireController, playerName, () => {
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
      const tank = yield select(selectors.playerTank, playerName)
      if (tank != null) {
        if (bullets.some(b => (b.tankId === tank.tankId))) {
          console.debug('bullet-completed. notify')
          noteChannel.put('bullet-complete')
        }
      }
    }
  })

  while (true) {
    const command: AICommand = yield take(commandChannel)
    // console.log('[saga] receive:', command)
    if (command.type === 'forward') {
      const tank = yield select(selectors.playerTank, playerName)
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
    } else {
      throw new Error()
    }
  }

  function* getAIInput() {
    const tank = yield select(selectors.playerTank, playerName)
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
        noteChannel.put('reach')
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

function* sendMessagesToWorker(worker: Worker, noteChannel: Channel<Note>) {
  // todo 因为现在用的是inlineAI, 所以下面就不从noteChannel中take了
  // yield fork(function* sendNote() {
  //   while (true) {
  //     const note: Note = yield take(noteChannel)
  //     worker.postMessage(JSON.stringify(note))
  //   }
  // })

  yield fork(function* sendCommonActions() {
    while (true) {
      const action = yield take((action: Action) => (
        action.type !== 'TICK'
        && action.type !== 'AFTER_TICK'
        && action.type !== 'MOVE'
        && action.type !== 'UPDATE_BULLETS')
      )
      worker.postMessage(JSON.stringify(action))
    }
  })
}

interface WorkerConstructor {
  new(): Worker
}

/**
 * AIWorkerSaga对应一个正在游戏中的AI玩家.
 * 当一个AI玩家坦克创建/激活时, 一个AIWorkerSaga实例将被创建
 * 当AI玩家的坦克被击毁时, saga实例将停止运行
 * 一个AIWorkerSaga实例总是对应一个正在游戏中的AI玩家坦克
 *
 * 在创建AiWorkerSaga的过程中, 将创建worker对象,
 * 并将创建noteChannel和commandChannel
 * 游戏逻辑和AI逻辑使用这两个channel来进行数据交换
 */
function* AIWorkerSaga(playerName: string, WorkerClass: WorkerConstructor) {
  const worker = new WorkerClass()
  try {
    // noteChannel用来向AI程序发送消息/通知
    const noteChannel = makeChannel<Note>()
    let postMessage = null
    // commandChannel用来从AI程序获取command
    const commandChannel = eventChannel<AICommand>((emitter) => {
      const listener = (event: MessageEvent) => emitter(event.data)
      // todo 目前用inlineAi进行测试
      postMessage = emitter
      worker.addEventListener('message', listener)
      return () => worker.removeEventListener('message', listener)
    })

    yield all([
      handleReceiveMessages(playerName, commandChannel, noteChannel),
      inlineAI(playerName, postMessage, noteChannel),
      sendMessagesToWorker(worker, noteChannel),
    ])
  } finally {
    worker.terminate()
  }
}

/** AIMasterSaga用来管理AIWorkerSaga的启动和停止, 并处理和AI程序的数据交互 */
export default function* AIMasterSaga() {
  const taskMap: { [key: string]: Task } = {}

  let nextAIPlayerIndex = 0
  while (true) {
    const actionTypes: ActionType[] = ['KILL', 'LOAD_STAGE']
    const action: Action = yield take(actionTypes)
    if (action.type === 'LOAD_STAGE') {
      yield* addAI()
      yield* addAI()
    } else if (action.type === 'KILL' && action.targetTank.side === 'ai') {
      // ai-player的坦克被击毁了
      const task = taskMap[action.targetPlayer.playerName]
      task.cancel()
      delete taskMap[action.targetPlayer.playerName]
      yield* addAI()
    }
  }

  function* addAI() {
    const { game: { remainingEnemyCount } }: State = yield select()
    if (remainingEnemyCount > 0) {
      const playerName = `AI-${nextAIPlayerIndex++}`
      yield put({
        type: 'CREATE_PLAYER',
        playerName,
        lives: Infinity,
      })
      const { x, y } = yield select(selectors.availableSpawnPosition)
      yield put({ type: 'DECREMENT_REMAINING_ENEMY_COUNT' })
      const tankId = yield* spawnTank(TankRecord({ x, y, side: 'ai' }))
      taskMap[playerName] = yield spawn(AIWorkerSaga, playerName, EmptyWorker)

      yield put<Action.ActivatePlayerAction>({
        type: 'ACTIVATE_PLAYER',
        playerName,
        tankId,
      })
    } else {
      // todo 在这里判断stage清空 不好
      yield put({ type: 'CLEAR_STAGE' })
    }
  }
}
