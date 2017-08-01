import { put, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import TankRecord from 'types/TankRecord'
import { spawnTank } from 'utils/common'
import { State } from 'reducers/index'
import PlayerRecord from 'types/PlayerRecord'

export default function* humanPlayerSaga(playerName: string) {
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
        level: 'basic',
      }))
      yield put({
        type: 'ACTIVATE_PLAYER',
        playerName,
        tankId,
      })
    }
  }
}
