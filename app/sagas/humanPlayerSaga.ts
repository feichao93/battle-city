import { put, fork, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import { testCollide, asBox, frame } from 'utils/common'
import { TankRecord, PlayerRecord, State } from 'types'
import { spawnTank, nonPauseDelay } from 'sagas/common'
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

  // todo bug 进入新的关卡的时候, human tank一开始会出现在上一关结束的位置
  // todo bug 进入新的关卡的时候, human tank会重置为最低等级的坦克
  while (true) {
    const action: Action = yield take((action: Action) => (
      action.type === 'START_STAGE'
      || action.type === 'KILL' && action.targetPlayer.playerName === playerName
    ))
    const { players }: State = yield select()
    const player = players.get(playerName)
    if (player.lives > 0) {
      if (action.type === 'KILL') {
        // todo 是否需要这个delay??
        yield nonPauseDelay(250)
      }
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
}
