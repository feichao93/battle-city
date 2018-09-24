import { all, put, race, select, take, takeEvery } from 'redux-saga/effects'
import AIWorkerSaga from '../ai/AIWorkerSaga'
import Bot from '../ai/Bot'
import { State } from '../reducers'
import { TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import * as selectors from '../utils/selectors'
import { explosionFromTank, scoreFromKillTank } from './common/destroyTanks'
import directionController from './directionController'
import fireController from './fireController'

export default function* botSaga(tankId: TankId) {
  const ctx = new Bot(tankId)
  try {
    yield takeEvery(hitPredicate, hitHandler)
    const result = yield race({
      service: all([
        generateBulletCompleteNote(),
        directionController(tankId, ctx.directionControllerCallback),
        fireController(tankId, ctx.fireControllerCallback),
        AIWorkerSaga(ctx),
      ]),
      killed: take(killedPredicate),
      endGame: take(A.EndGame),
    })
    const tank: TankRecord = yield select(selectors.tank, tankId)
    yield put(actions.setTankToDead(tankId))
    if (result.killed) {
      yield explosionFromTank(tank)
      if (result.killed.method === 'bullet') {
        yield scoreFromKillTank(tank)
      }
    }
    yield put(actions.reqAddBot())
  } finally {
    const tank: TankRecord = yield select(selectors.tank, tankId)
    if (tank && tank.alive) {
      yield put(actions.setTankToDead(tankId))
    }
  }

  function hitPredicate(action: actions.Action) {
    return action.type === actions.A.Hit && action.targetTank.tankId === tankId
  }

  function* hitHandler(action: actions.Hit) {
    const tank: TankRecord = yield select(selectors.tank, tankId)
    DEV.ASSERT && console.assert(tank != null)
    if (tank.hp > 1) {
      yield put(actions.hurt(tank))
    } else {
      const { sourceTank, targetTank } = action
      yield put(actions.kill(targetTank, sourceTank, 'bullet'))
    }
  }

  function killedPredicate(action: actions.Action) {
    return action.type === actions.A.Kill && action.targetTank.tankId === tankId
  }

  function* generateBulletCompleteNote() {
    while (true) {
      const { bulletId }: actions.BeforeRemoveBullet = yield take(actions.A.BeforeRemoveBullet)
      const { bullets }: State = yield select()
      const bullet = bullets.get(bulletId)
      if (bullet.tankId === tankId) {
        ctx.noteChannel.put({ type: 'bullet-complete', bullet })
      }
    }
  }
}
