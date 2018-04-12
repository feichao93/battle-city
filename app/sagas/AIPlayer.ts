import { all, put, race, select, take, takeEvery } from 'redux-saga/effects'
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
    const player = new PlayerRecord({ playerName, side: 'ai' })
    yield put<Action>({ type: 'ADD_PLAYER', player })
    yield put<Action>({ type: 'ACTIVATE_PLAYER', playerName, tankId })
    yield race<any>([
      all([
        takeEvery(hitPredicate, hitHandler),
        generateBulletCompleteNote(),
        directionController(playerName, ctx.directionControllerCallback),
        fireController(playerName, ctx.fireControllerCallback),
        AIWorkerSaga(ctx),
      ]),
      take(killedPredicate),
      take('END_GAME'),
    ])
    yield put<Action>({ type: 'REQ_ADD_AI_PLAYER' })
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    yield put({ type: 'REMOVE_TANK', tankId })
    yield explosionFromTank(tank)
    yield scoreFromKillTank(tank)
  } finally {
    // 我们在这里不移除 AI 玩家，因为 AI 玩家的子弹可能还处于活跃状态
    // AI 玩家会在下一次关卡开始的后自动被清除
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank && tank.active) {
      yield put({ type: 'REMOVE_TANK', tankId })
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
