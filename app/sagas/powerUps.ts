import { delay } from 'redux-saga'
import { fork, put, take, select, takeEvery, takeLatest } from 'redux-saga/effects'
import { State, MapRecord, ScoreRecord } from 'types'
import { N_MAP, ITEM_SIZE_MAP } from 'utils/constants'
import { iterRowsAndCols, asBox, getNextId } from 'utils/common'
import { destroyTanks } from 'sagas/bulletsSaga'

function convertToBricks(map: MapRecord) {
  const { eagle, steels, bricks } = map
  const eagleSurroundingBox = {
    x: eagle.x - 8,
    y: eagle.y - 8,
    width: 32 - 1,
    height: 32 - 1,
  }

  const btset = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
      .map(([brow, bcol]) => brow * N_MAP.BRICK + bcol)
  )
  const eagleBTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, asBox(eagle, -0.1)))
      .map(([brow, bcol]) => brow * N_MAP.BRICK + bcol)
  )
  const ttset = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
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
  const surroundingTTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.STEEL, eagleSurroundingBox))
      .map(([trow, tcol]) => trow * N_MAP.STEEL + tcol)
  )
  const eagleTTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.STEEL, asBox(eagle, -0.1)))
      .map(([trow, tcol]) => trow * N_MAP.STEEL + tcol)
  )
  const steels2 = steels.map((set, t) => (
    (surroundingTTSet.has(t) && !eagleTTSet.has(t)) ? true : set)
  )

  const surroundBTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
      .map(([brow, bcol]) => brow * N_MAP.BRICK + bcol)
  )
  const bricks2 = bricks.map((set, t) => (surroundBTSet.has(t) ? false : set))

  return map.set('steels', steels2)
    .set('bricks', bricks2)
}

function* shovel() {
  yield put<Action>({
    type: 'UPDATE_MAP',
    map: convertToSteels((yield select()).map),
  })

  // shovel的有效时间
  yield delay(3e3)

  // 闪烁
  yield put<Action>({
    type: 'UPDATE_MAP',
    map: convertToBricks((yield select()).map),
  })
  for (let i = 0; i < 4; i++) {
    yield delay(200)
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToSteels((yield select()).map),
    })
    yield delay(200)
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToBricks((yield select()).map),
    })
  }
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
  const { tanks, players }: State = yield select()
  const activeAITanks = tanks.filter(t => (t.active && t.side === 'ai'))
  const aiTankIdSet = activeAITanks.map(t => t.tankId).toSet()

  yield* destroyTanks(aiTankIdSet)

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
    duration: 6e3,
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

function* showScoreWhenPickPowerUp(action: Action.PickPowerUpAction) {
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
}

export default function* powerUps() {
  yield takeEvery('PICK_POWER_UP', showScoreWhenPickPowerUp)

  yield takeLatest(is('shovel'), shovel)
  yield takeLatest(is('timer'), timer)

  yield takeEvery(is('grenade'), grenade)
  yield takeEvery(is('star'), star)
  yield takeEvery(is('tank'), tank)
  yield takeEvery(is('helmet'), helmet)

  yield fork(handleHelmetDuration)
}
