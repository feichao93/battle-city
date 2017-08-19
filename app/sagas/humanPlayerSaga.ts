import { put, fork, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import TankRecord from 'types/TankRecord'
import { spawnTank, testCollide, asBox } from 'utils/common'
import * as selectors from 'utils/selectors'
import { State } from 'reducers/index'
import PlayerRecord from 'types/PlayerRecord'

function* handlePickPowerUps(playerName: string) {
  while (true) {
    yield take('AFTER_TICK')
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    // console.assert(tank != null, 'tank is null in handlePickPowerUps')
    if (tank == null) {
      continue
    }
    const { powerUps }: State = yield select()
    const powerUp = powerUps.find(p => testCollide(asBox(p), asBox(tank)))
    if (powerUp) {
      yield put<Action>({
        type: 'PICK_POWER_UP',
        tank,
        powerUpId: powerUp.powerUpId,
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
    yield take((action: Action) => (
      action.type === 'LOAD_STAGE'
      || action.type === 'KILL' && action.targetPlayer.playerName === playerName
    ))
    const { players }: State = yield select()
    const player = players.get(playerName)
    if (player.lives > 0) {
      // todo 是否可以等待一会儿 再开始生成坦克
      yield put({ type: 'DECREMENT_PLAYER_LIVE', playerName })
      const tankId = yield* spawnTank(TankRecord({
        x: 4 * BLOCK_SIZE,
        y: 12 * BLOCK_SIZE,
        side: 'human',
        color: tankColor,
        level: 'basic',
        // todo 为了调试方便, 强化一下坦克
        bulletSpeed: 0.2,
        bulletInterval: 100,
        bulletLimit: Infinity,
      }))
      yield put({
        type: 'ACTIVATE_PLAYER',
        playerName,
        tankId,
      })
    }
  }
}
