import { delay } from 'redux-saga'
import { put, fork, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import TankRecord from 'types/TankRecord'
import { spawnTank, testCollide, asBox, frame } from 'utils/common'
import * as selectors from 'utils/selectors'
import { State } from 'reducers/index'
import PlayerRecord from 'types/PlayerRecord'

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

  while (true) {
    const action: Action = yield take((action: Action) => (
      action.type === 'LOAD_STAGE'
      || action.type === 'KILL' && action.targetPlayer.playerName === playerName
    ))
    const { players }: State = yield select()
    const player = players.get(playerName)
    if (player.lives > 0) {
      yield delay(500)
      yield put({ type: 'DECREMENT_PLAYER_LIFE', playerName })
      const tankId = yield* spawnTank(TankRecord({
        x: 4 * BLOCK_SIZE,
        y: 12 * BLOCK_SIZE,
        side: 'human',
        color: tankColor,
        level: 'basic',
        helmetDuration: action.type === 'LOAD_STAGE' ? frame(135) : frame(180),
      }))
      yield put({
        type: 'ACTIVATE_PLAYER',
        playerName,
        tankId,
      })
    }
  }
}
