import _ from 'lodash'
import { cancelled, fork, put, race, select, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { calculateFireEstimateMap, getFireResist } from '../ai/fire-utils'
import getAllSpots from '../ai/getAllSpots'
import { around, getTankSpot } from '../ai/spot-utils'
import { MapRecord, PowerUpRecord, ScoreRecord, State } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { asRect, frame as f, getNextId, randint } from '../utils/common'
import { BLOCK_SIZE, N_MAP, POWER_UP_NAMES } from '../utils/constants'
import IndexHelper from '../utils/IndexHelper'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import { destroyTank } from './common/destroyTanks'
import powerUpLifecycle from './powerUpLifecycle'

function convertToBricks(map: MapRecord) {
  const { eagle, steels, bricks } = map
  const eagleSurroundingBox = {
    x: eagle.x - 8,
    y: eagle.y - 8,
    width: 32 - 1,
    height: 32 - 1,
  }

  const btset = new Set(IndexHelper.iter('brick', eagleSurroundingBox))
  const eagleBTSet = new Set(IndexHelper.iter('brick', asRect(eagle, -0.1)))
  const ttset = new Set(
    Array.from(IndexHelper.iterRowCol('brick', eagleSurroundingBox)).map(([brow, bcol]) => {
      const trow = Math.floor(brow / 2)
      const tcol = Math.floor(bcol / 2)
      return trow * N_MAP.STEEL + tcol
    }),
  )

  const steels2 = steels.map((set, t) => (ttset.has(t) ? false : set))
  const bricks2 = bricks.map((set, t) => (btset.has(t) && !eagleBTSet.has(t) ? true : set))

  return map.set('steels', steels2).set('bricks', bricks2)
}

function convertToSteels(map: MapRecord) {
  const { eagle, steels, bricks } = map
  const eagleSurroundingBox = {
    x: eagle.x - 8,
    y: eagle.y - 8,
    width: 32 - 1,
    height: 32 - 1,
  }
  const surroundingTTSet = new Set(IndexHelper.iter('steel', eagleSurroundingBox))
  const eagleTTSet = new Set(IndexHelper.iter('steel', asRect(eagle, -0.1)))
  const nextSteels = steels.map(
    (set, t) => (surroundingTTSet.has(t) && !eagleTTSet.has(t) ? true : set),
  )

  const surroundBTSet = new Set(IndexHelper.iter('brick', eagleSurroundingBox))
  const nextBricks = bricks.map((set, t) => (surroundBTSet.has(t) ? false : set))

  return map.set('steels', nextSteels).set('bricks', nextBricks)
}

function* shovel() {
  try {
    yield put(actions.updateMap(convertToSteels((yield select()).map)))

    yield Timing.delay(f(1076))

    // 总共闪烁6次
    for (let i = 0; i < 6; i++) {
      yield put(actions.updateMap(convertToBricks((yield select()).map)))
      yield Timing.delay(f(16))
      yield put(actions.updateMap(convertToSteels((yield select()).map)))
      yield Timing.delay(f(16))
    }
  } finally {
    // 最后变回brick-wall
    yield put(actions.updateMap(convertToBricks((yield select()).map)))
  }
}

function* timer() {
  try {
    yield put(actions.setAIFrozenTimeout(5e3))
    while (true) {
      const { delta }: actions.Tick = yield take(actions.A.Tick)
      const {
        game: { AIFrozenTimeout },
      }: State = yield select()
      if (AIFrozenTimeout === 0) {
        break
      }
      const next = AIFrozenTimeout - delta
      yield put(actions.setAIFrozenTimeout(next <= 0 ? 0 : next))
    }
  } finally {
    if (yield cancelled()) {
      yield put(actions.setAIFrozenTimeout(0))
    }
  }
}

function* grenade(action: actions.PickPowerUp) {
  const { tanks: allTanks, players }: State = yield select()
  const activeAITanks = allTanks.filter(t => t.active && t.side === 'ai')

  for (const targetTank of activeAITanks.values()) {
    yield put(
      actions.kill(
        targetTank,
        action.tank,
        players.find(p => p.activeTankId === targetTank.tankId),
        action.player,
        'grenade',
      ),
    )

    yield fork(destroyTank, targetTank)
  }
}

function* star({ tank }: actions.PickPowerUp) {
  yield put(actions.upgardeTank(tank.tankId))
}

function* tank({ player }: actions.PickPowerUp) {
  yield put(actions.incrementPlayerLife(player.playerName))
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
    yield* tanks
      .filter(tank => tank.active && tank.helmetDuration > 0)
      .map(tank => put(actions.setHelmetDuration(tank.tankId, tank.helmetDuration - delta)))
      .values()
  }
}

function* scoreFromPickPowerUp({ powerUp: { x, y } }: actions.PickPowerUp) {
  const scoreId = getNextId('score')
  try {
    const score = new ScoreRecord({ scoreId, score: 500, x, y })
    yield put(actions.addScore(score))
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

  // 如果玩家坦克仍然是 BASIC 增加 star 的概率
  const humanPlayer = state.players.find(ply => ply.side === 'human')
  if (humanPlayer != null && humanPlayer.active) {
    const tank = selectors.playerTank(state, humanPlayer.playerName)
    if (tank != null && (tank.level === 'basic' || tank.level === 'fast')) {
      if (Math.random() < 0.5) {
        return 'star'
      }
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
  if (tank.side === 'ai' && tank.withPowerUp) {
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
