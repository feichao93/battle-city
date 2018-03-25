import { Map as IMap } from 'immutable'
import AITankCtx from 'ai/AITankCtx'
import { getEnv, RelativePosition } from 'ai/env-utils'
import {
  calculateFireEstimateMap,
  FireEstimate,
  getAIFireCount,
  getFireResist,
} from 'ai/fire-utils'
import followPath from 'ai/followPath'
import getAllSpots from 'ai/getAllSpots'
import { logAI } from 'ai/logger'
import { around, getTankSpot, getBulletSpot } from 'ai/spot-utils'
import Spot from 'ai/Spot'
import { findPath } from 'ai/shortest-path'
import simpleFireLoop from 'ai/simpleFireLoop'
import EventEmitter from 'events'
import { State } from 'reducers'
import { Task } from 'redux-saga'
import { fork, select, take, race } from 'redux-saga/effects'
import directionController from 'sagas/directionController'
import fireController from 'sagas/fireController'
import { TankFireInfo, TankRecord } from 'types'
import { randint, waitFor } from 'utils/common'
import * as selectors from 'utils/selectors'
import Timing from 'utils/Timing'
import * as dodgeUtils from 'ai/dodge-utils'
import { BLOCK_DISTANCE_THRESHOLD, BLOCK_TIMEOUT } from '../utils/constants'

function getRandomPassableSpot(posInfoArray: Spot[]) {
  while (true) {
    const t = randint(0, 26 ** 2)
    if (posInfoArray[t].canPass) {
      return t
    }
  }
}

function* wanderMode(ctx: AITankCtx) {
  DEV.LOG_AI && logAI('enter wander-mode')
  const simpleFireLoopTask: Task = yield fork(simpleFireLoop, ctx)
  const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
  DEV.ASSERT && console.assert(tank != null)
  const { map }: State = yield select()
  const allSpots = getAllSpots(map)
  const path = findPath(allSpots, getTankSpot(tank), getRandomPassableSpot(allSpots))
  if (path != null) {
    yield followPath(ctx, path)
  } else {
    yield Timing.delay(200)
  }
  simpleFireLoopTask.cancel()
}

function* attackEagleMode(ctx: AITankCtx) {
  DEV.LOG_AI && logAI('enter attack-eagle-mode')
  const simpleFireLoopTask: Task = yield fork(simpleFireLoop, ctx)
  const { map }: State = yield select()
  const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
  DEV.ASSERT && console.assert(tank != null)
  const eagleWeakSpots = around(getTankSpot(map.eagle))
  const allSpots = getAllSpots(map)
  const estMap = calculateFireEstimateMap(eagleWeakSpots, allSpots, map)
  const candidates = Array.from(estMap.keys()).filter(
    t => allSpots[t].canPass && getFireResist(estMap.get(t)) <= 8,
  )
  const target = candidates[randint(0, candidates.length)]
  const path = findPath(allSpots, getTankSpot(tank), target)
  if (path != null) {
    yield followPath(ctx, path)
    simpleFireLoopTask.cancel()
    yield attackEagle(ctx, estMap.get(target))
  } else {
    simpleFireLoopTask.cancel()
    yield Timing.delay(200)
  }
}

function* attackEagle(ctx: AITankCtx, fireEstimate: FireEstimate) {
  DEV.LOG_AI && logAI('start attack eagle')
  const { map, tanks }: State = yield select()
  const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
  DEV.ASSERT && console.assert(tank != null)
  const env = getEnv(map, tanks, tank)
  ctx.turn(env.tankPosition.eagle.getPrimaryDirection())
  yield take('TICK') // 等待一个 tick, 确保转向已经完成
  let fireCount = getAIFireCount(fireEstimate)
  while (fireCount > 0) {
    const fireInfo: TankFireInfo = yield select(selectors.fireInfo, ctx.playerName)
    if (fireInfo.canFire) {
      ctx.fire()
      yield waitFor(ctx.noteEmitter, 'bullet-complete')
      fireCount--
    } else {
      yield Timing.delay(fireInfo.cooldown)
    }
  }
}

function* generateBulletCompleteNote(ctx: AITankCtx) {
  while (true) {
    const { bulletId }: Action.BeforeRemoveBulletAction = yield take('BEFORE_REMOVE_BULLET')
    const { bullets }: State = yield select()
    const bullet = bullets.get(bulletId)
    if (bullet.playerName === ctx.playerName) {
      ctx.noteEmitter.emit('bullet-complete', bullet)
    }
  }
}

// TODO WIP
function* dangerDetectionLoop(ctx: AITankCtx) {
  while (true) {
    const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
    DEV.ASSERT && console.assert(tank != null)
    const tankWeakSpots = around(getTankSpot(tank))
    const { map, bullets, tanks }: State = yield select()
    const allSpots = getAllSpots(map)
    const estMap = IMap(calculateFireEstimateMap(tankWeakSpots, allSpots, map))
    // directEstMap: 开火后可以直接击中坦克的那些位置
    const directEstMap = estMap.filter(est => getFireResist(est) === 0)
    // upcomingBullets: 即将击中坦克的子弹
    const upcomingBullets = bullets.filter(
      blt =>
        tanks.get(blt.tankId).side === 'human' &&
        directEstMap.has(getBulletSpot(blt)) &&
        // TODO 直接调用getPrimaryDirection可能会有一点点的误差
        new RelativePosition(blt, tank).getPrimaryDirection() === blt.direction,
    )
    if (!upcomingBullets.isEmpty()) {
      DEV.LOG_AI && logAI('danger-detected', upcomingBullets.toJS())
      // 这里坦克只考虑躲避第一个子弹
      const bullet = upcomingBullets.first()
      // 尝试以下方式来躲避危险
      // 1. 继续前进
      if (dodgeUtils.canMoveToDodge(tank, bullet)) {
        // TODO
      }
      // 2. 向前开火以抵消攻击
      // 3. 找到一个附近的 passable spot，然后开到那个位置
    }
    yield Timing.delay(200)
  }
}

function* blocked(ctx: AITankCtx) {
  let acc = 0
  let lastTank = yield select(selectors.playerTank, ctx.playerName)
  while (acc < BLOCK_TIMEOUT) {
    const { delta }: Action.TickAction = yield take('TICK')
    const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
    if (tank.frozenTimeout > 0) {
      continue
    }
    if (Math.abs(tank.x - lastTank.x) + Math.abs(tank.y - lastTank.y) <= BLOCK_DISTANCE_THRESHOLD) {
      acc += delta
    } else {
      acc = 0
    }
    lastTank = tank
  }
  DEV.LOG_AI && logAI('blocked')
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
  const ctx = new AITankCtx(playerName, new EventEmitter())

  yield fork(directionController, playerName, ctx.directionControllerCallback)
  yield fork(fireController, playerName, ctx.fireControllerCallback)
  yield fork(generateBulletCompleteNote, ctx)

  yield take(
    (action: Action) => action.type === 'ACTIVATE_PLAYER' && action.playerName === ctx.playerName,
  )
  yield fork(dangerDetectionLoop, ctx)

  let continuousWanderCount = 0
  while (true) {
    yield race<any>([blocked(ctx), mode()])
  }

  function* mode() {
    if (Math.random() < 0.8 - continuousWanderCount * 0.05) {
      continuousWanderCount++
      yield wanderMode(ctx)
    } else {
      continuousWanderCount = 0
      yield attackEagleMode(ctx)
    }
  }
}
