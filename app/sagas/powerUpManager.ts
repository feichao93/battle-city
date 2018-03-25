import _ from 'lodash'
import { fork, put, select, take, cancelled, takeEvery, takeLatest } from 'redux-saga/effects'
import { MapRecord, ScoreRecord, State, PowerUpRecord } from 'types'
import { destroyTanks } from 'sagas/common'
import powerUpLifecycle from 'sagas/powerUpLifecycle'
import { N_MAP, POWER_UP_NAMES } from 'utils/constants'
import { asRect, frame as f, getNextId } from 'utils/common'
import * as selectors from 'utils/selectors'
import IndexHelper from 'utils/IndexHelper'
import Timing from '../utils/Timing'

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
  const steels2 = steels.map(
    (set, t) => (surroundingTTSet.has(t) && !eagleTTSet.has(t) ? true : set),
  )

  const surroundBTSet = new Set(IndexHelper.iter('brick', eagleSurroundingBox))
  const bricks2 = bricks.map((set, t) => (surroundBTSet.has(t) ? false : set))

  return map.set('steels', steels2).set('bricks', bricks2)
}

function* shovel() {
  try {
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToSteels((yield select()).map),
    })

    yield Timing.delay(f(1076))

    // 总共闪烁6次
    for (let i = 0; i < 6; i++) {
      yield put<Action>({
        type: 'UPDATE_MAP',
        map: convertToBricks((yield select()).map),
      })
      yield Timing.delay(f(16))
      yield put<Action>({
        type: 'UPDATE_MAP',
        map: convertToSteels((yield select()).map),
      })
      yield Timing.delay(f(16))
    }
  } finally {
    // 最后变回brick-wall
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToBricks((yield select()).map),
    })
  }
}

function* timer() {
  try {
    yield put<Action>({
      type: 'SET_AI_FROZEN_TIMEOUT',
      AIFrozenTimeout: 5e3,
    })
    while (true) {
      const { delta }: Action.TickAction = yield take('TICK')
      const { game: { AIFrozenTimeout } }: State = yield select()
      if (AIFrozenTimeout === 0) {
        break
      }
      const next = AIFrozenTimeout - delta
      yield put<Action>({
        type: 'SET_AI_FROZEN_TIMEOUT',
        AIFrozenTimeout: next <= 0 ? 0 : next,
      })
    }
  } finally {
    if (yield cancelled()) {
      yield put<Action>({ type: 'SET_AI_FROZEN_TIMEOUT', AIFrozenTimeout: 0 })
    }
  }
}

function* grenade(action: Action.PickPowerUpAction) {
  const { tanks: allTanks, players }: State = yield select()
  const activeAITanks = allTanks.filter(t => t.active && t.side === 'ai')

  yield* activeAITanks
    .map(targetTank =>
      put<Action.Kill>({
        type: 'KILL',
        sourcePlayer: action.player,
        sourceTank: action.tank,
        targetPlayer: players.find(p => p.activeTankId === targetTank.tankId),
        targetTank,
        method: 'grenade',
      }),
    )
    .values()

  // TODO 是否可以在这里调用 destroy-tank?
  yield* destroyTanks(activeAITanks)
}

function* star({ tank }: Action.PickPowerUpAction) {
  yield put<Action>({ type: 'UPGRADE_TANK', tankId: tank.tankId })
}

function* tank({ player }: Action.PickPowerUpAction) {
  yield put<Action>({ type: 'INCREMENT_PLAYER_LIFE', playerName: player.playerName })
}

function* helmet({ tank }: Action.PickPowerUpAction) {
  yield put<Action.SetHelmetDurationAction>({
    type: 'SET_HELMET_DURATION',
    tankId: tank.tankId,
    duration: f(630),
  })
}

const is = (name: PowerUpName) => (action: Action) =>
  action.type === 'PICK_POWER_UP' && action.powerUp.powerUpName === name

/** 在每个 TICK 的时候，更新坦克的 telmet 持续时间 */
function* handleHelmetDuration() {
  while (true) {
    const { delta }: Action.TickAction = yield take('TICK')
    const { tanks }: State = yield select()
    yield* tanks
      .filter(tank => tank.active && tank.helmetDuration > 0)
      .map(tank =>
        put({
          type: 'SET_HELMET_DURATION',
          tankId: tank.tankId,
          duration: tank.helmetDuration - delta,
        } as Action.SetHelmetDurationAction),
      )
      .values()
  }
}

function* scoreFromPickPowerUp(action: Action.PickPowerUpAction) {
  const scoreId = getNextId('score')
  try {
    const { powerUp: { x, y } } = action
    yield put<Action.AddScoreAction>({
      type: 'ADD_SCORE',
      score: new ScoreRecord({
        scoreId,
        score: 500,
        x,
        y,
      }),
    })
    yield Timing.delay(f(48))
  } finally {
    yield put<Action.RemoveScoreAction>({
      type: 'REMOVE_SCORE',
      scoreId,
    })
  }
}

function* spawnPowerUpIfNeccessary(action: Action.Hit) {
  if (action.targetTank.withPowerUp) {
    yield put<Action.RemovePowerUpProperty>({
      type: 'REMOVE_POWER_UP_PROPERTY',
      tankId: action.targetTank.tankId,
    })
    const powerUpName = _.sample(POWER_UP_NAMES)
    const position: Point = _.sample(yield select(selectors.validPowerUpSpawnPositions))
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

function* clearAllPowerUps({ tank }: Action.StartSpawnTank) {
  if (tank.side === 'ai' && tank.withPowerUp) {
    yield put<Action>({ type: 'CLEAR_ALL_POWER_UPS' })
  }
}

export default function* powerUpManager() {
  yield takeEvery('START_SPAWN_TANK', clearAllPowerUps)

  /** 处理道具掉落相关逻辑 */
  yield takeEvery('HIT', spawnPowerUpIfNeccessary)

  /** 处理道具拾取时触发的相应逻辑 */
  yield takeEvery('PICK_POWER_UP', scoreFromPickPowerUp)

  yield takeLatest(is('shovel'), shovel)
  yield takeLatest(is('timer'), timer)

  yield takeEvery(is('grenade'), grenade)
  yield takeEvery(is('star'), star)
  yield takeEvery(is('tank'), tank)
  yield takeEvery(is('helmet'), helmet)

  yield fork(handleHelmetDuration)
}
