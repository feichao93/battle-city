import { cancelled, fork, put, race, select, take, takeEvery } from 'redux-saga/effects'
import AITankCtx from '../ai/AITankCtx'
import AIWorkerSaga from '../ai/AIWorkerSaga'
import { State } from '../reducers'
import { PlayerRecord, TankRecord } from '../types'
import * as selectors from '../utils/selectors'
import { explosionFromTank, scoreFromKillTank } from './common/destroyTanks'
import directionController from './directionController'
import fireController from './fireController'

export default function* AIPlayer(playerName: string, tankId: TankId) {
  const ctx = new AITankCtx(playerName)
  try {
    yield takeEvery(hitPredicate, hitHandler)
    yield fork(directionController, playerName, ctx.directionControllerCallback)
    yield fork(fireController, playerName, ctx.fireControllerCallback)
    yield fork(generateBulletCompleteNote)

    yield put<Action>({
      type: 'ADD_PLAYER',
      player: new PlayerRecord({
        playerName,
        lives: Infinity,
        side: 'ai',
      }),
    })
    yield put<Action>({ type: 'ACTIVATE_PLAYER', playerName, tankId })

    // prettier-ignore
    yield race<any>([
      take(killedPredicate),
      take('END_GAME'),
      AIWorkerSaga(ctx),
    ])
  } finally {
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank != null) {
      yield put<Action>({ type: 'REMOVE_TANK', tankId: tank.tankId })
    }
    // 我们在这里不移除 AI 玩家，因为 AI 玩家的子弹可能还处于活跃状态
    if (!(yield cancelled())) {
      yield put<Action>({ type: 'REQ_ADD_AI_PLAYER' })
    }
  }

  /* ----------- below are function definitions ----------- */

  function hitPredicate(action: Action) {
    return action.type === 'HIT' && action.targetPlayer.playerName === playerName
  }

  function* hitHandler(action: Action.Hit) {
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    DEV.ASSERT && console.assert(tank != null)
    if (tank.hp > 1) {
      yield put<Action>({ type: 'HURT', targetTank: tank })
    } else {
      const { sourcePlayer, sourceTank, targetPlayer, targetTank } = action
      yield put<Action.Kill>({
        type: 'KILL',
        method: 'bullet',
        sourcePlayer,
        sourceTank,
        targetPlayer,
        targetTank,
      })

      yield put({ type: 'REMOVE_TANK', tankId: tank.tankId })
      yield explosionFromTank(tank)
      yield scoreFromKillTank(tank)
    }
  }

  function killedPredicate(action: Action) {
    return (
      action.type === 'KILL' &&
      action.targetTank.side === 'ai' &&
      action.targetPlayer.playerName === playerName
    )
  }

  function* generateBulletCompleteNote() {
    while (true) {
      const { bulletId }: Action.BeforeRemoveBulletAction = yield take('BEFORE_REMOVE_BULLET')
      const { bullets }: State = yield select()
      const bullet = bullets.get(bulletId)
      if (bullet.playerName === ctx.playerName) {
        ctx.noteEmitter.emit('bullet-complete', bullet)
      }
    }
  }
}
