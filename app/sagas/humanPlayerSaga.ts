import { fork, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { spawnTank } from '../sagas/common'
import { PlayerConfig, PlayerRecord, State, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { asRect, frame, getNextId, testCollide } from '../utils/common'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import { explosionFromTank } from './common/destroyTanks'
import humanController from './humanController'

function* handlePickPowerUps(playerName: string) {
  const tank: TankRecord = yield select(selectors.playerTank, playerName)
  if (tank != null) {
    const { powerUps, players }: State = yield select()
    const powerUp = powerUps.find(p => testCollide(asRect(p, -0.5), asRect(tank)))
    if (powerUp) {
      yield put(actions.pickPowerUp(players.get(playerName), tank, powerUp))
    }
  }
}

/** 关卡开始时, 需要创建玩家的tank.
 * 如果玩家在上一关结束时有坦克保留, 则这一关开始的时候使用上一关保留的坦克 */
function* startStage(playerName: string, config: PlayerConfig) {
  const { players }: State = yield select()
  const player = players.get(playerName)

  if (player.reservedTank || player.lives > 0) {
    if (!player.reservedTank) {
      yield put(actions.decrementPlayerLife(playerName))
    }

    yield put(actions.setReservedTank(playerName, null))

    const tankPrototype =
      player.reservedTank ||
      new TankRecord({
        side: 'human',
        color: config.color,
        level: 'basic',
      })

    const tankId = getNextId('tank')
    yield spawnTank(
      tankPrototype.merge({
        tankId,
        active: true,
        x: config.spawnPos.x,
        y: config.spawnPos.y,
        direction: 'up',
        helmetDuration: frame(135),
      }),
    )
    yield put(actions.activatePlayer(playerName, tankId))
  }
}

function* beforeEndStage(playerName: string) {
  const tank = yield select(selectors.playerTank, playerName)
  if (tank) {
    yield put(actions.setReservedTank(playerName, tank))
    yield put(actions.deactivateTank(tank.tankId))
  }
}

export default function* humanPlayerSaga(playerName: string, config: PlayerConfig) {
  try {
    yield put(actions.addPlayer(new PlayerRecord({ playerName, lives: 3, side: 'human' })))

    yield takeEvery(A.AfterTick, handlePickPowerUps, playerName)
    yield takeEvery(A.StartStage, startStage, playerName, config)
    yield takeEvery(A.BeforeEndStage, beforeEndStage, playerName)
    yield takeLatest(hitByTeammatePredicate, hitByTeammateHandler)
    yield takeEvery(hitByEnemyPredicate, hitByEnemyHandler)
    yield fork(newTankHelper)

    yield humanController(playerName, config)
  } finally {
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank != null) {
      yield put(actions.deactivateTank(tank.tankId))
    }
    yield put(actions.removePlayer(playerName))
  }

  // region function deftinitions
  function hitByTeammatePredicate(action: actions.Action) {
    return (
      action.type === A.Hit &&
      action.targetPlayer.playerName === playerName &&
      action.sourcePlayer.side === 'human'
    )
  }

  function* hitByTeammateHandler(action: actions.Hit) {
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    DEV.ASSERT && console.assert(tank != null && tank.hp === 1)
    DEV.ASSERT && console.assert(action.sourcePlayer.side === 'human')
    yield put(actions.setFrozenTimeout(tank.tankId, 1000))
    try {
      while (true) {
        const tank: TankRecord = yield select(selectors.playerTank, playerName)
        yield Timing.delay(150)
        if (tank.frozenTimeout <= 0) {
          break
        }
        yield put(actions.setTankVisibility(tank.tankId, !tank.visible))
      }
    } finally {
      yield put(actions.setTankVisibility(tank.tankId, true))
    }
  }

  function hitByEnemyPredicate(action: actions.Action) {
    return (
      action.type === A.Hit &&
      action.targetPlayer.playerName === playerName &&
      action.sourcePlayer.side === 'ai'
    )
  }

  function* hitByEnemyHandler(action: actions.Hit) {
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    DEV.ASSERT && console.assert(tank != null && tank.hp === 1)
    DEV.ASSERT && console.assert(action.sourcePlayer.side === 'ai')
    // 玩家的坦克 HP 始终为 1. 一旦被 AI 击中就需要派发 KILL
    const { sourcePlayer, sourceTank, targetPlayer, targetTank } = action
    yield put(actions.kill(targetTank, sourceTank, targetPlayer, sourcePlayer, 'bullet'))

    yield put(actions.deactivateTank(tank.tankId))
    yield explosionFromTank(tank)
    // 唤醒新的human tank
    yield put(actions.reqAddPlayerTank(playerName))
  }

  function* newTankHelper() {
    while (true) {
      yield take(
        (action: actions.Action) =>
          action.type === A.ReqAddPlayerTank && action.playerName === playerName,
      )
      const { players }: State = yield select()
      const player = players.get(playerName)
      if (player.lives > 0) {
        yield put(actions.decrementPlayerLife(playerName))
        const tankId = getNextId('tank')
        yield spawnTank(
          new TankRecord({
            tankId,
            x: config.spawnPos.x,
            y: config.spawnPos.y,
            side: 'human',
            color: config.color,
            level: 'basic',
            helmetDuration: frame(180),
          }),
        )
        yield put(actions.activatePlayer(playerName, tankId))
      }
    }
  }
  // endregion
}
