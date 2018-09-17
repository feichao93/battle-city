import { all, put, race, select, take, takeEvery } from 'redux-saga/effects'
import AITankCtx from '../ai/AITankCtx'
import AIWorkerSaga from '../ai/AIWorkerSaga'
import { State } from '../reducers'
import { PlayerRecord, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import * as selectors from '../utils/selectors'
import { explosionFromTank, scoreFromKillTank } from './common/destroyTanks'
import directionController from './directionController'
import fireController from './fireController'

export default function* AIPlayer(playerName: string, tankId: TankId) {
  const ctx = new AITankCtx(playerName)
  try {
    const player = new PlayerRecord({ playerName, side: 'ai' })
    yield put(actions.addPlayer(player))
    yield put(actions.activatePlayer(playerName, tankId))
    yield race<any>([
      all([
        takeEvery(hitPredicate, hitHandler),
        generateBulletCompleteNote(),
        directionController(playerName, ctx.directionControllerCallback),
        fireController(playerName, ctx.fireControllerCallback),
        AIWorkerSaga(ctx),
      ]),
      take(killedPredicate),
      take(A.EndGame),
    ])
    yield put(actions.reqAddAIPlayer())
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    yield put(actions.deactivateTank(tankId))
    yield explosionFromTank(tank)
    yield scoreFromKillTank(tank)
  } finally {
    // 我们在这里不移除 AI 玩家，因为 AI 玩家的子弹可能还处于活跃状态
    // AI 玩家会在下一次关卡开始的后自动被清除
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank && tank.active) {
      yield put(actions.deactivateTank(tankId))
    }
  }

  /* ----------- below are function definitions ----------- */

  function hitPredicate(action: actions.Action) {
    return action.type === actions.A.Hit && action.targetPlayer.playerName === playerName
  }

  function* hitHandler(action: actions.Hit) {
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    DEV.ASSERT && console.assert(tank != null)
    if (tank.hp > 1) {
      yield put(actions.hurt(tank))
    } else {
      const { sourcePlayer, sourceTank, targetPlayer, targetTank } = action
      yield put(actions.kill(targetTank, sourceTank, targetPlayer, sourcePlayer, 'bullet'))
    }
  }

  function killedPredicate(action: actions.Action) {
    return (
      action.type === actions.A.Kill &&
      action.targetTank.side === 'ai' &&
      action.targetPlayer.playerName === playerName
    )
  }

  function* generateBulletCompleteNote() {
    while (true) {
      const { bulletId }: actions.BeforeRemoveBullet = yield take(actions.A.BeforeRemoveBullet)
      const { bullets }: State = yield select()
      const bullet = bullets.get(bulletId)
      if (bullet.playerName === ctx.playerName) {
        ctx.noteChannel.put({ type: 'bullet-complete', bullet })
      }
    }
  }
}
