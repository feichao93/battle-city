import { put, fork, select, take, takeEvery } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import { testCollide, asBox, frame } from 'utils/common'
import { TankRecord, PlayerRecord, State } from 'types'
import { spawnTank } from 'sagas/common'
import * as selectors from 'utils/selectors'

function* handlePickPowerUps(playerName: string) {
  while (true) {
    yield take('AFTER_TICK')
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank == null) {
      continue
    }
    const { powerUps, players }: State = yield select()
    const powerUp = powerUps.find(p => testCollide(asBox(p, -0.5), asBox(tank)))
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

export default function* humanPlayerSaga(playerName: string, tankColor: TankColor) {
  yield fork(handlePickPowerUps, playerName)
  yield put<Action>({
    type: 'CREATE_PLAYER',
    player: PlayerRecord({
      playerName,
      lives: 3,
      side: 'human',
    }),
  })

  yield takeEvery('START_STAGE', startStage)

  while (true) {
    // todo 这个可以用takeEvery来优化写法
    const action: Action = yield take((action: Action) => (
      action.type === 'KILL' && action.targetPlayer.playerName === playerName
    ))
    const { players }: State = yield select()
    const player = players.get(playerName)
    if (player.lives > 0) {
      yield put({ type: 'DECREMENT_PLAYER_LIFE', playerName })
      const tankId = yield* spawnTank(TankRecord({
        x: 4 * BLOCK_SIZE,
        y: 12 * BLOCK_SIZE,
        side: 'human',
        color: tankColor,
        level: 'basic',
        helmetDuration: action.type === 'START_STAGE' ? frame(135) : frame(180),
      }))
      yield put({
        type: 'ACTIVATE_PLAYER',
        playerName,
        tankId,
      })
    }
  }

  function* startStage(action: Action.StartStage) {
    const { players, tanks }: State = yield select()
    const player = players.get(playerName)
    const existingTank = tanks.get(player.activeTankId)

    if (existingTank || player.lives > 0) {
      if (!existingTank) {
        yield put<Action.DecrementPlayerLifeAction>({
          type: 'DECREMENT_PLAYER_LIFE',
          playerName,
        })
      }

      const tankPrototype = existingTank || TankRecord({
        side: 'human',
        color: tankColor,
        level: 'basic',
      })

      const tankId = yield* spawnTank(tankPrototype.merge({
        active: true,
        x: 4 * BLOCK_SIZE,
        y: 12 * BLOCK_SIZE,
        direction: 'up',
        helmetDuration: action.type === 'START_STAGE' ? frame(135) : frame(180),
      }))
      yield put({
        type: 'ACTIVATE_PLAYER',
        playerName,
        tankId,
      })
    }
  }
}
