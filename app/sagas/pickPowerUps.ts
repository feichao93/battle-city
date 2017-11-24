import { fork, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { MapRecord, ScoreRecord, State } from 'types'
import { N_MAP } from 'utils/constants'
import { asRect, frame as f, getNextId } from 'utils/common'
import { destroyTanks, nonPauseDelay } from 'sagas/common'
import IndexHelper from 'utils/IndexHelper'

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
  const ttset = new Set(Array.from(IndexHelper.iterRowCol('brick', eagleSurroundingBox))
    .map(([brow, bcol]) => {
      const trow = Math.floor(brow / 2)
      const tcol = Math.floor(bcol / 2)
      return trow * N_MAP.STEEL + tcol
    })
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
  const steels2 = steels.map((set, t) => (
    (surroundingTTSet.has(t) && !eagleTTSet.has(t)) ? true : set)
  )

  const surroundBTSet = new Set(IndexHelper.iter('brick', eagleSurroundingBox))
  const bricks2 = bricks.map((set, t) => (surroundBTSet.has(t) ? false : set))

  return map.set('steels', steels2)
    .set('bricks', bricks2)
}

function* shovel() {
  yield put<Action>({
    type: 'UPDATE_MAP',
    map: convertToSteels((yield select()).map),
  })

  yield nonPauseDelay(f(1076))

  // 总共闪烁6次
  for (let i = 0; i < 6; i++) {
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToBricks((yield select()).map),
    })
    yield nonPauseDelay(f(16))
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToSteels((yield select()).map),
    })
    yield nonPauseDelay(f(16))
  }

  // 最后变回brick-wall
  yield put<Action>({
    type: 'UPDATE_MAP',
    map: convertToBricks((yield select()).map),
  })
}

function* timer() {
  yield put<Action.SetAIFrozenTimeoutAction>({
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
    yield put<Action.SetAIFrozenTimeoutAction>({
      type: 'SET_AI_FROZEN_TIMEOUT',
      AIFrozenTimeout: next <= 0 ? 0 : next,
    })
  }
}

function* grenade(action: Action.PickPowerUpAction) {
  const { tanks: allTanks, players }: State = yield select()
  const activeAITanks = allTanks.filter(t => (t.active && t.side === 'ai'))

  yield* destroyTanks(activeAITanks)

  // todo 确定需要put KILL?
  yield* activeAITanks.map(targetTank => put<Action.KillAction>({
    type: 'KILL',
    sourcePlayer: action.player,
    sourceTank: action.tank,
    targetPlayer: players.find(p => p.activeTankId === targetTank.tankId),
    targetTank,
  })).values()
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

const is = (name: PowerUpName) => (action: Action) => (
  action.type === 'PICK_POWER_UP'
  && action.powerUp.powerUpName === name
)

function* handleHelmetDuration() {
  while (true) {
    const { delta }: Action.TickAction = yield take('TICK')
    const { tanks }: State = yield select()
    yield* tanks.filter(tank => (tank.active && tank.helmetDuration > 0))
      .map(tank => put({
        type: 'SET_HELMET_DURATION',
        tankId: tank.tankId,
        duration: tank.helmetDuration - delta,
      } as Action.SetHelmetDurationAction))
      .values()
  }
}

function* scoreFromPickPowerUp(action: Action.PickPowerUpAction) {
  const { powerUp: { x, y } } = action
  const scoreId = getNextId('score')
  yield put<Action.AddScoreAction>({
    type: 'ADD_SCORE',
    score: ScoreRecord({
      scoreId,
      score: 500,
      x,
      y,
    }),
  })
  yield nonPauseDelay(f(48))
  yield put<Action.RemoveScoreAction>({
    type: 'REMOVE_SCORE',
    scoreId,
  })
}

/** 该saga用来处理道具拾取时触发的相应逻辑 */
export default function* pickPowerUps() {
  yield takeEvery('PICK_POWER_UP', scoreFromPickPowerUp)

  yield takeLatest(is('shovel'), shovel)
  yield takeLatest(is('timer'), timer)

  yield takeEvery(is('grenade'), grenade)
  yield takeEvery(is('star'), star)
  yield takeEvery(is('tank'), tank)
  yield takeEvery(is('helmet'), helmet)

  yield fork(handleHelmetDuration)
}
