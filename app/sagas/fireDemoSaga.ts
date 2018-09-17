import { all, fork, put, take } from 'redux-saga/effects'
import { delay } from 'redux-saga/utils'
import { PlayerRecord, TankRecord } from '../types'
import { StageConfigConverter } from '../types/StageConfig'
import * as actions from '../utils/actions'
import { A, Action } from '../utils/actions'
import { getNextId } from '../utils/common'
import { BLOCK_SIZE as B } from '../utils/constants'
import bulletsSaga from './bulletsSaga'
import { spawnTank } from './common'
import { explosionFromTank } from './common/destroyTanks'
import directionController from './directionController'
import fireController from './fireController'
import tickEmitter from './tickEmitter'

const always = (v: any) => () => v

function* demoHumanController(playerName: string) {
  let fire = false

  yield all([
    directionController(playerName, always(null)),
    fireController(playerName, shouldFire),
    setFireToTrueEvery3Seconds(),
  ])

  function shouldFire() {
    if (fire) {
      fire = false
      return true
    } else {
      return false
    }
  }
  function* setFireToTrueEvery3Seconds() {
    while (true) {
      fire = true
      yield delay(3000)
    }
  }
}

export function* demohumanPalyerSaga(playerName: string, tankPrototype: TankRecord) {
  const player = new PlayerRecord({
    playerName,
    lives: 3,
    side: 'human',
  })
  yield put(actions.addPlayer(player))
  yield fork(demoHumanController, playerName)

  const tankId = getNextId('tank')
  yield spawnTank(tankPrototype.set('tankId', tankId), 2)
  yield put(actions.activatePlayer(playerName, tankId))
}

export const demoStage = StageConfigConverter.r2s({
  name: 'demo',
  custom: false,
  difficulty: 1,
  map: [
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  R  F  S  Bf Bf Ta X  X  X  X  X  X  ',
    'X  R  F  S  Bf Bf Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  E  ',
  ],
  enemies: [],
})

export function* demoAIMasterSaga() {
  while (true) {
    const tankId = getNextId('tank')
    const tank = new TankRecord({
      tankId,
      x: 5.5 * B,
      y: 0.5 * B,
      side: 'ai',
      level: 'basic',
      hp: 1,
      direction: 'left',
    })
    yield spawnTank(tank, 1.5)
    yield take((action: Action) => action.type === A.Hit && action.targetTank.tankId === tankId)
    yield put(actions.deactivateTank(tankId))
    yield explosionFromTank(tank)
    yield delay(7e3)
  }
}

export default function* fireDemoSaga() {
  yield fork(tickEmitter, { slow: 5, bindESC: true })
  yield fork(bulletsSaga)
  yield put(actions.loadStageMap(demoStage))
  yield fork(demoAIMasterSaga)
  const baseTank = new TankRecord({
    active: true,
    side: 'human',
    level: 'basic',
    direction: 'right',
  })
  yield fork(
    demohumanPalyerSaga,
    'yellow-player',
    baseTank.set('y', 0.5 * B).set('color', 'yellow'),
  )
  yield fork(
    demohumanPalyerSaga,
    'green-player',
    baseTank
      .set('y', 3.5 * B)
      .set('color', 'green')
      .set('level', 'fast'),
  )
}
