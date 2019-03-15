import { all, fork, put, take, delay } from 'redux-saga/effects'
import { TankRecord } from '../types'
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

function* demoPlayerContronller(tankId: TankId) {
  let fire = false

  yield all([
    directionController(tankId, always(null)),
    fireController(tankId, shouldFire),
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

export function* demoPlayerSaga(tankPrototype: TankRecord) {
  const tankId = getNextId('tank')
  yield spawnTank(tankPrototype.set('tankId', tankId), 2)
  yield fork(demoPlayerContronller, tankId)
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
  bots: [],
})

export function* demoAIMasterSaga() {
  while (true) {
    const tankId = getNextId('tank')
    const tank = new TankRecord({
      tankId,
      x: 5.5 * B,
      y: 0.5 * B,
      side: 'bot',
      level: 'basic',
      hp: 1,
      direction: 'left',
    })
    yield spawnTank(tank, 1.5)
    yield take((action: Action) => action.type === A.Hit && action.targetTank.tankId === tankId)
    yield put(actions.setTankToDead(tankId))
    yield explosionFromTank(tank)
    yield delay(7e3)
  }
}

export default function* fireDemoSaga() {
  yield fork(tickEmitter, { slow: 5, bindESC: true })
  yield fork(bulletsSaga)
  yield put(actions.loadStageMap(demoStage))
  yield fork(demoAIMasterSaga)
  const baseTank = new TankRecord({ direction: 'right' })
  const yelloTank = baseTank.merge({ y: 0.5 * B, color: 'yellow' })
  const greenTank = baseTank.merge({ y: 3.5 * B, color: 'green', level: 'fast' })
  yield fork(demoPlayerSaga, yelloTank)
  yield fork(demoPlayerSaga, greenTank)
}
