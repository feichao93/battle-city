import { put, select, takeEvery } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import { asRect, frame, testCollide } from 'utils/common'
import { PlayerRecord, State, TankRecord } from 'types'
import { spawnTank } from 'sagas/common'
import * as selectors from 'utils/selectors'
import { CONTROL_CONFIG } from '../utils/constants'
import humanController from './humanController'

function* handlePickPowerUps(playerName: string) {
  const tank: TankRecord = yield select(selectors.playerTank, playerName)
  if (tank != null) {
    const { powerUps, players }: State = yield select()
    const powerUp = powerUps.find(p => testCollide(asRect(p, -0.5), asRect(tank)))
    if (powerUp) {
      yield put<Action>({
        type: 'PICK_POWER_UP',
        tank,
        powerUp,
        player: players.get(playerName),
      })
    }
  }
}

/** 关卡开始时, 需要创建玩家的tank.
 * 如果玩家在上一关结束时有坦克保留, 则这一关开始的时候使用上一关保留的坦克 */
function* startStage(playerName: string, tankColor: TankColor) {
  const { players }: State = yield select()
  const player = players.get(playerName)

  if (player.reservedTank || player.lives > 0) {
    if (!player.reservedTank) {
      yield put<Action.DecrementPlayerLifeAction>({
        type: 'DECREMENT_PLAYER_LIFE',
        playerName,
      })
    }

    yield put<Action.SetReversedTank>({
      type: 'SET_REVERSED_TANK',
      playerName,
      reversedTank: null,
    })

    const tankPrototype =
      player.reservedTank ||
      new TankRecord({
        side: 'human',
        color: tankColor,
        level: 'basic',
      })

    const tankId = yield* spawnTank(
      tankPrototype.merge({
        active: true,
        x: 4 * BLOCK_SIZE,
        y: 12 * BLOCK_SIZE,
        direction: 'up',
        helmetDuration: frame(135),
      }),
    )
    yield put<Action.ActivatePlayer>({
      type: 'ACTIVATE_PLAYER',
      playerName,
      tankId,
    })
  }
}

function* endStage(playerName: string) {
  const tank = yield select(selectors.playerTank, playerName)
  if (tank) {
    yield put<Action.SetReversedTank>({
      type: 'SET_REVERSED_TANK',
      playerName,
      reversedTank: tank,
    })
  }
}

function* killed(playerName: string, tankColor: TankColor) {
  // TODO 将bullet-saga中移除坦克的逻辑放到这里
  const { players }: State = yield select()
  const player = players.get(playerName)
  if (player.lives > 0) {
    yield put({ type: 'DECREMENT_PLAYER_LIFE', playerName })
    const tankId = yield* spawnTank(
      new TankRecord({
        x: 4 * BLOCK_SIZE,
        y: 12 * BLOCK_SIZE,
        side: 'human',
        color: tankColor,
        level: 'basic',
        helmetDuration: frame(180),
      }),
    )
    yield put({
      type: 'ACTIVATE_PLAYER',
      playerName,
      tankId,
    })
  }
}

export default function* humanPlayerSaga(playerName: string, tankColor: TankColor) {
  try {
    yield put<Action>({
      type: 'ADD_PLAYER',
      player: new PlayerRecord({
        playerName,
        lives: 3,
        side: 'human',
      }),
    })

    yield takeEvery('AFTER_TICK', handlePickPowerUps, playerName)
    yield takeEvery('START_STAGE', startStage, playerName, tankColor)
    yield takeEvery('BEFORE_END_STAGE', endStage, playerName)
    yield takeEvery(killedAction, killed, playerName, tankColor)

    function killedAction(action: Action) {
      return action.type === 'KILL' && action.targetPlayer.playerName === playerName
    }

    yield humanController(playerName, CONTROL_CONFIG.player1)
  } finally {
    yield put<Action>({ type: 'REMOVE_PALYER', playerName })
  }
}
