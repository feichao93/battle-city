import { Map as IMap } from 'immutable'
import { Task } from 'redux-saga'
import { fork, race, select, take } from 'redux-saga/effects'
import { State } from '../reducers'
import { TankFireInfo, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { randint } from '../utils/common'
import { BLOCK_DISTANCE_THRESHOLD, BLOCK_TIMEOUT } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import Bot from './Bot'
import * as dodgeUtils from './dodge-utils'
import { getEnv, RelativePosition } from './env-utils'
import { calculateFireEstimateMap, FireEstimate, getAIFireCount, getFireResist } from './fire-utils'
import followPath from './followPath'
import getAllSpots from './getAllSpots'
import { logAI } from './logger'
import { findPath } from './shortest-path'
import simpleFireLoop from './simpleFireLoop'
import Spot from './Spot'
import { around, getBulletSpot, getTankSpot } from './spot-utils'

function getRandomPassableSpot(posInfoArray: Spot[]) {
  while (true) {
    const t = randint(0, 26 ** 2)
    if (posInfoArray[t].canPass) {
      return t
    }
  }
}

function* wanderMode(ctx: Bot) {
  DEV.LOG_AI && logAI('enter wander-mode')
  const simpleFireLoopTask: Task = yield fork(simpleFireLoop, ctx)
  const tank: TankRecord = yield select(selectors.tank, ctx.tankId)
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

function* attackEagleMode(ctx: Bot) {
  DEV.LOG_AI && logAI('enter attack-eagle-mode')
  const simpleFireLoopTask: Task = yield fork(simpleFireLoop, ctx)
  const { map }: State = yield select()
  const tank: TankRecord = yield select(selectors.tank, ctx.tankId)
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

function* attackEagle(ctx: Bot, fireEstimate: FireEstimate) {
  DEV.LOG_AI && logAI('start attack eagle')
  const { map, tanks }: State = yield select()
  const tank: TankRecord = yield select(selectors.tank, ctx.tankId)
  DEV.ASSERT && console.assert(tank != null)
  const env = getEnv(map, tanks, tank)
  ctx.turn(env.tankPosition.eagle.getPrimaryDirection())
  yield take(A.Tick) // 等待一个 tick, 确保转向已经完成
  let fireCount = getAIFireCount(fireEstimate)
  while (fireCount > 0) {
    const fireInfo: TankFireInfo = yield select(selectors.fireInfo, ctx.tankId)
    if (fireInfo.canFire) {
      ctx.fire()
      yield take(ctx.noteChannel, 'bullet-complete')
      fireCount--
    } else {
      yield Timing.delay(fireInfo.cooldown)
    }
  }
}

// TODO WIP
function* dangerDetectionLoop(ctx: Bot) {
  while (true) {
    const tank: TankRecord = yield select(selectors.tank, ctx.tankId)
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
        tanks.get(blt.tankId).side === 'player' &&
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

function* blocked(ctx: Bot) {
  let acc = 0
  let lastTank = yield select(selectors.tank, ctx.tankId)
  while (acc < BLOCK_TIMEOUT) {
    const { delta }: actions.Tick = yield take(actions.A.Tick)
    const tank: TankRecord = yield select(selectors.tank, ctx.tankId)
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
export default function* AIWorkerSaga(ctx: Bot) {
  yield fork(dangerDetectionLoop, ctx)

  let continuousWanderCount = 0
  while (true) {
    yield race<any>([blocked(ctx), mode()])
  }

  function* mode() {
    if (Math.random() < 0.9 - continuousWanderCount * 0.02) {
      continuousWanderCount++
      yield wanderMode(ctx)
    } else {
      continuousWanderCount = 0
      yield attackEagleMode(ctx)
    }
  }
}
