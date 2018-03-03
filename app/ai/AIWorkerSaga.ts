import { TankClassBase } from 'components/tanks'
import EventEmitter from 'events'
import { TanksMap } from 'reducers/tanks'
import { channel, Channel, delay } from 'redux-saga'
import { all, call, fork, put, race, select, take } from 'redux-saga/effects'
import { TankRecord, TankFireInfo } from 'types'
import { calculatePriorityMap, determineFire, getEnv, getRandomDirection } from './AI-utils'
import { State } from '../reducers'
import directionController from '../sagas/directionController'
import fireController from '../sagas/fireController'
import { getDirectionInfo, reverseDirection } from '../utils/common'
import * as selectors from '../utils/selectors'

function* waitFor(emitter: EventEmitter, expectedType: string) {
  let callback: any
  try {
    yield new Promise(resolve => {
      callback = resolve
      emitter.addListener(expectedType, resolve)
    })
  } finally {
    emitter.removeListener(expectedType, callback)
  }
}

// yield fork(function* notifyWhenBulletComplete() {
//   while (true) {
//     // TODO 修复BUG
//     const { bullets }: Action.DestroyBulletsAction = yield take('DESTROY_BULLETS')
//     const tank = yield select(selectors.playerTank, playerName)
//     if (tank != null) {
//       if (bullets.some(b => (b.tankId === tank.tankId))) {
//         console.debug('bullet-completed. notify')
//         noteChannel.put({ type: 'bullet-complete' })
//       }
//     }
//   }
// })

function* moveLoop(ctx: AITankCtx) {
  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      console.log(
        'move-loop-result:',
        yield race({
          timeout: delay(3e3),
          reach: waitFor(ctx.noteEmitter, 'reach'),
          // TODO implement notifyWhenBulletComplete
          bulletComplete: waitFor(ctx.noteEmitter, 'bullet-complete'),
        }),
      )
    }

    let tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
    if (tank == null) {
      continue
    }
    const { map, tanks }: State = yield select()

    const env = getEnv(map, tanks, tank)

    const priorityMap = calculatePriorityMap(env)

    // 降低回头的优先级
    const reverse = reverseDirection(tank.direction)
    priorityMap[reverse] = Math.min(priorityMap[reverse], 1)

    const nextDirection = getRandomDirection(priorityMap)

    if (tank.direction !== nextDirection) {
      yield put<AICommand>(ctx.commandChannel, { type: 'turn', direction: nextDirection })
      tank = tank.set('direction', nextDirection)
      // 等待足够长的时间, 保证turn命令已经被处理
      yield delay(100)
    }

    // TODO tank应该更加偏向于走到下一个 *路口*
    yield put<AICommand>(ctx.commandChannel, {
      type: 'forward',
      forwardLength: env.barrierInfo[tank.direction].length,
    })
  }
}

function* fireLoop(ctx: AITankCtx) {
  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      console.log(
        'fire-loop race result',
        yield race({
          timeout: delay(300),
          bulletComplete: waitFor(ctx.noteEmitter, 'bullet-complete'),
        }),
      )
    }

    let tank = yield select(selectors.playerTank, ctx.playerName)
    if (tank == null) {
      continue
    }
    const fireInfo: TankFireInfo = yield select(selectors.fireInfo, ctx.playerName)
    if (fireInfo.canFire) {
      const { map, tanks }: State = yield select()

      const env = getEnv(map, tanks, tank)
      if (determineFire(tank, env)) {
        yield put<AICommand>(ctx.commandChannel, { type: 'fire' })
        yield delay(500)
      }
    }
  }
}

function* handleCommands(ctx: AITankCtx) {
  while (true) {
    const command: AICommand = yield take(ctx.commandChannel)
    if (command.type === 'forward') {
      const tank = yield select(selectors.playerTank, ctx.playerName)
      if (tank == null) {
        continue
      }
      const { xy } = getDirectionInfo(tank.direction)
      ctx.startPos = tank.get(xy)
      ctx.forwardLength = command.forwardLength
    } else if (command.type === 'fire') {
      ctx.fire = true
    } else if (command.type === 'turn') {
      ctx.nextDirection = command.direction
    } else {
      throw new Error()
    }
  }
}

function* getAIInput(ctx: AITankCtx) {
  const tank = yield select(selectors.playerTank, ctx.playerName)
  if (tank == null) {
    return null
  }
  // fixme 转向的时候会将当前前进的信息清除, 导致转向命令和前进命令不能共存
  if (ctx.nextDirection && tank.direction !== ctx.nextDirection) {
    const direction = ctx.nextDirection
    ctx.nextDirection = null
    ctx.forwardLength = 0
    return { type: 'turn', direction }
  } else if (ctx.forwardLength > 0) {
    const { xy } = getDirectionInfo(tank.direction)
    const movedLength = Math.abs(tank.get(xy) - ctx.startPos)
    const maxDistance = ctx.forwardLength - movedLength
    if (movedLength === ctx.forwardLength) {
      ctx.forwardLength = 0
      ctx.noteEmitter.emit('reach')
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

function shouldFire(ctx: AITankCtx) {
  if (ctx.fire) {
    ctx.fire = false
    return true
  } else {
    return false
  }
}

class AITankCtx {
  fire = false
  nextDirection: Direction = null
  forwardLength = 0
  startPos = 0

  constructor(
    readonly playerName: string,
    readonly commandChannel: Channel<AICommand>,
    readonly noteEmitter: EventEmitter,
  ) {}
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
export default function* AIWorkerSaga(playerName: string) {
  const ctx = new AITankCtx(playerName, channel<AICommand>(), new EventEmitter())

  yield fork(directionController, playerName, () => getAIInput(ctx))
  yield fork(fireController, playerName, () => shouldFire(ctx))

  yield fork(moveLoop, ctx)
  yield fork(fireLoop, ctx)
  yield fork(handleCommands, ctx)
}
