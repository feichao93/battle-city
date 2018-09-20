import { put, race, select, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { State, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { asRect, testCollide } from '../utils/common'
import { TANK_KILL_SCORE_MAP } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import { explosionFromTank } from './common/destroyTanks'

function* handleTankPickPowerUps(tankId: TankId) {
  const { tanks, powerUps }: State = yield select()
  const tank = tanks.get(tankId)
  const powerUp = powerUps.find(p => testCollide(asRect(p, -0.5), asRect(tank)))

  if (powerUp) {
    yield put(actions.pickPowerUp(yield select(selectors.playerName, tankId), tank, powerUp))
  }
}

export default function* playerTankSaga(playerName: PlayerName, tankId: TankId) {
  const { hit: hitAction }: { hit: actions.Hit } = yield race({
    service: service(),
    hit: take(hitByBotPredicate),
  })

  const tank: TankRecord = yield select(selectors.tank, tankId)
  DEV.ASSERT && console.assert(tank != null && tank.hp === 1)
  DEV.ASSERT && console.assert(hitAction.sourceTank.side === 'bot')
  // 玩家的坦克 HP 始终为 1. 一旦被 bot 击中就需要派发 KILL
  const { sourceTank, targetTank } = hitAction
  yield put(actions.kill(targetTank, sourceTank, 'bullet'))
  yield put(actions.setTankToDead(tank.tankId))
  yield explosionFromTank(tank)
  return true

  function hitByTeammatePredicate(action: actions.Action) {
    return (
      action.type === A.Hit &&
      action.targetTank.tankId === tankId &&
      action.sourceTank.side === 'player'
    )
  }

  function* service() {
    yield takeEvery(A.AfterTick, handleTankPickPowerUps, tankId)
    yield takeLatest(hitByTeammatePredicate, hitByTeammateHandler)
    yield takeEvery(killBot, killBotHandler)
  }

  function* hitByTeammateHandler(action: actions.Hit) {
    DEV.ASSERT && console.assert(action.targetTank.side === 'player')
    yield put(actions.setFrozenTimeout(tankId, 1000))
    try {
      while (true) {
        yield Timing.delay(150)
        const tank: TankRecord = yield select(selectors.tank, tankId)
        yield put(actions.setTankVisibility(tank.tankId, !tank.visible))
        if (tank.frozenTimeout === 0) {
          break
        }
      }
    } finally {
      yield put(actions.setTankVisibility(tankId, true))
    }
  }

  function hitByBotPredicate(action: actions.Action) {
    return (
      action.type === A.Hit &&
      action.targetTank.tankId === tankId &&
      action.sourceTank.side === 'bot'
    )
  }

  function killBot(action: actions.Action) {
    return action.type === A.Kill && action.sourceTank.tankId === tankId
  }

  function* killBotHandler({ method, sourceTank, targetTank }: actions.Kill) {
    DEV.ASSERT && console.assert(sourceTank.tankId === tankId)
    yield put(actions.incKillCount(playerName, targetTank.level))
    if (method === 'bullet') {
      yield put(actions.incPlayerScore(playerName, TANK_KILL_SCORE_MAP[targetTank.level]))
    }
  }
}
