import { Set as ISet } from 'immutable'
import _ from 'lodash'
import { cancelled, fork, put, race, select, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { calculateFireEstimateMap, getFireResist } from '../ai/fire-utils'
import getAllSpots from '../ai/getAllSpots'
import { around, getTankSpot } from '../ai/spot-utils'
import { MapRecord, PowerUpRecord, ScoreRecord, State, TanksMap } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { asRect, frame as f, getNextId, randint } from '../utils/common'
import {
  BLOCK_SIZE,
  N_MAP,
  POWER_UP_NAMES,
  POWER_UP_SCORE,
  STAR_PICKED_BY_ARMOR_TANK_SCORE,
} from '../utils/constants'
import IndexHelper from '../utils/IndexHelper'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import { destroyTank } from './common/destroyTanks'
import powerUpLifecycle from './powerUpLifecycle'

/** 将 eagle 周围的元素变为 bricks */
function convertToBricks(map: MapRecord, tanks: TanksMap) {
  const { eagle, steels, bricks } = map
  const eagleSurroundingBox = {
    x: eagle.x - 8,
    y: eagle.y - 8,
    width: 32 - 1,
    height: 32 - 1,
  }

  const surroundingBTSet = new Set(IndexHelper.iter('brick', eagleSurroundingBox))
  const eagleBTSet = new Set(IndexHelper.iter('brick', asRect(eagle, -0.1)))
  const tanksBTSet = new Set(tanks
    .map(tank => ISet(IndexHelper.iter('brick', asRect(tank, -0.1))))
    .toSet()
    .flatten() as ISet<number>)

  const ttset = new Set(
    Array.from(IndexHelper.iterRowCol('brick', eagleSurroundingBox)).map(([brow, bcol]) => {
      const trow = Math.floor(brow / 2)
      const tcol = Math.floor(bcol / 2)
      return trow * N_MAP.STEEL + tcol
    }),
  )

  const nextSteels = steels.map((set, t) => (ttset.has(t) ? false : set))
  const nextBricks = bricks.map((set, t) =>
    surroundingBTSet.has(t) && !eagleBTSet.has(t) && !tanksBTSet.has(t) ? true : set,
  )

  return map.set('steels', nextSteels).set('bricks', nextBricks)
}

/** 将 eagle 周围的元素变为 steels */
function convertToSteels(map: MapRecord, tanks: TanksMap) {
  const { eagle, steels, bricks } = map
  const eagleSurroundingBox = {
    x: eagle.x - 8,
    y: eagle.y - 8,
    width: 32 - 1,
    height: 32 - 1,
  }
  const surroundingTTSet = new Set(IndexHelper.iter('steel', eagleSurroundingBox))
  const eagleTTSet = new Set(IndexHelper.iter('steel', asRect(eagle, -0.1)))
  const tanksTTSet = new Set(tanks
    .map(tank => ISet(IndexHelper.iter('steel', asRect(tank, -0.1))))
    .toSet()
    .flatten() as ISet<number>)

  const nextSteels = steels.map((set, t) =>
    surroundingTTSet.has(t) && !eagleTTSet.has(t) && !tanksTTSet.has(t) ? true : set,
  )

  const surroundBTSet = new Set(IndexHelper.iter('brick', eagleSurroundingBox))
  const nextBricks = bricks.map((set, t) => (surroundBTSet.has(t) ? false : set))

  return map.set('steels', nextSteels).set('bricks', nextBricks)
}

function* shovel() {
  try {
    const { map: map1, tanks: tanks1 } = yield select()
    yield put(actions.updateMap(convertToSteels(map1, tanks1)))

    yield Timing.delay(f(1076))

    // 总共闪烁6次
    for (let i = 0; i < 6; i++) {
      const { map: map2, tanks: tanks2 }: State = yield select()
      yield put(actions.updateMap(convertToBricks(map2, tanks2)))
      yield Timing.delay(f(16))

      const { map: map3, tanks: tanks3 }: State = yield select()
      yield put(actions.updateMap(convertToSteels(map3, tanks3)))
      yield Timing.delay(f(16))
    }
  } finally {
    // 最后变回brick-wall
    const { map: map4, tanks: tanks4 }: State = yield select()
    yield put(actions.updateMap(convertToBricks(map4, tanks4)))
  }
}

function* timer() {
  try {
    yield put(actions.setBotFrozenTimeout(5e3))
    while (true) {
      const { delta }: actions.Tick = yield take(actions.A.Tick)
      const {
        game: { botFrozenTimeout },
      }: State = yield select()
      if (botFrozenTimeout === 0) {
        break
      }
      const next = botFrozenTimeout - delta
      yield put(actions.setBotFrozenTimeout(next <= 0 ? 0 : next))
    }
  } finally {
    if (yield cancelled()) {
      yield put(actions.setBotFrozenTimeout(0))
    }
  }
}

function* grenade(action: actions.PickPowerUp) {
  const { tanks: allTanks }: State = yield select()
  const activeBotTanks = allTanks.filter(t => t.alive && t.side === 'bot')

  for (const targetTank of activeBotTanks.values()) {
    yield put(actions.kill(targetTank, action.tank, 'grenade'))

    yield fork(destroyTank, targetTank)
  }
}

function* star({ tank, playerName }: actions.PickPowerUp) {
  if (tank.level === 'armor') {
    yield put(actions.incPlayerScore(playerName, STAR_PICKED_BY_ARMOR_TANK_SCORE))
  } else {
    yield put(actions.upgardeTank(tank.tankId))
  }
}

function* tank({ playerName }: actions.PickPowerUp) {
  yield put(actions.incrementPlayerLife(playerName))
}

function* helmet({ tank }: actions.PickPowerUp) {
  yield put(actions.setHelmetDuration(tank.tankId, f(630)))
}

const is = (name: PowerUpName) => (action: actions.Action) =>
  action.type === actions.A.PickPowerUp && action.powerUp.powerUpName === name

/** 在每个 TICK 的时候，更新坦克的 telmet 持续时间 */
function* handleHelmetDuration() {
  while (true) {
    const { delta }: actions.Tick = yield take(actions.A.Tick)
    const { tanks }: State = yield select()
    for (const tank of tanks.filter(t => t.alive && t.helmetDuration > 0).values()) {
      const nextDuration = Math.max(0, tank.helmetDuration - delta)
      yield put(actions.setHelmetDuration(tank.tankId, nextDuration))
    }
  }
}

function* scoreFromPickPowerUp({ powerUp: { x, y }, playerName }: actions.PickPowerUp) {
  const scoreId = getNextId('score')
  try {
    const score = new ScoreRecord({ scoreId, score: POWER_UP_SCORE, x, y })
    yield put(actions.addScore(score))
    yield put(actions.incPlayerScore(playerName, POWER_UP_SCORE))
    yield Timing.delay(f(48))
  } finally {
    yield put(actions.removeScore(scoreId))
  }
}

function determineWhichPowerUpToSpawn(state: State): PowerUpName {
  // 如果我方老鹰因为周围墙较少 可以被直接击中的话 增加 shovel 的概率
  const eagleSpot = getTankSpot(state.map.eagle)
  const estMap = calculateFireEstimateMap(around(eagleSpot), getAllSpots(state.map), state.map)
  if (Array.from(estMap.keys()).some(t => t !== eagleSpot && getFireResist(estMap.get(t)) === 0)) {
    if (Math.random() < 0.5) {
      return 'shovel'
    }
  }

  // 如果玩家坦克仍然是 BASIC，则增加 star 的概率
  const player1Tank = selectors.tank(state, state.player1.activeTankId)
  const player2Tank = selectors.tank(state, state.player2.activeTankId)
  const hasBasicTank =
    (player1Tank && player1Tank.level === 'basic') || (player2Tank && player2Tank.level === 'basic')
  if (hasBasicTank) {
    if (Math.random() < 0.4) {
      return 'star'
    }
  }

  return _.sample(POWER_UP_NAMES)
}

function* spawnPowerUpIfNeccessary(action: actions.Hit) {
  if (action.targetTank.withPowerUp) {
    const state: State = yield select()
    yield put(actions.removePowerUpProperty(action.targetTank.tankId))
    const powerUpName = determineWhichPowerUpToSpawn(state)
    const position: Point = _.sample(selectors.validPowerUpSpawnPositions(state)) || {
      x: (randint(0, 25) / 2) * BLOCK_SIZE,
      y: (randint(0, 25) / 2) * BLOCK_SIZE,
    }
    yield powerUpLifecycle(
      new PowerUpRecord({
        powerUpId: getNextId('power-up'),
        powerUpName,
        visible: true,
        x: position.x,
        y: position.y,
      }),
    )
  }
}

function* clearAllPowerUps({ tank }: actions.StartSpawnTank) {
  if (tank.side === 'bot' && tank.withPowerUp) {
    yield put(actions.clearAllPowerUps())
  }
}

function raceEndStage(handler: any) {
  return function*() {
    yield race([take(A.EndStage), handler()])
  }
}

export default function* powerUpManager() {
  yield takeEvery(A.StartSpawnTank, clearAllPowerUps)

  /** 处理道具掉落相关逻辑 */
  yield takeEvery(A.Hit, spawnPowerUpIfNeccessary)

  /** 处理道具拾取时触发的相应逻辑 */
  yield takeEvery(A.PickPowerUp, scoreFromPickPowerUp)

  yield takeLatest(is('shovel'), raceEndStage(shovel))
  yield takeLatest(is('timer'), raceEndStage(timer))

  yield takeEvery(is('grenade'), grenade)
  yield takeEvery(is('star'), star)
  yield takeEvery(is('tank'), tank)
  yield takeEvery(is('helmet'), helmet)

  yield fork(handleHelmetDuration)
}
