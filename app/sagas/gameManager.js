import { delay } from 'redux-saga'
import { put, fork, take, call } from 'redux-saga/effects'
import * as A from 'utils/actions'
import { UP, TANK_SPAWN_DELAY, SIDE, BLOCK_SIZE } from 'utils/constants'
import { getNextId } from 'utils/common'

function* spawnTank({ x, y }) {
  yield put({
    type: A.SPAWN_FLICKER,
    flickerId: getNextId('flicker'),
    x,
    y,
  })
  yield delay(TANK_SPAWN_DELAY)
  const tankId = getNextId('tank')
  yield put({
    type: A.SPAWN_TANK,
    side: SIDE.PLAYER,
    tankId,
    x,
    y,
    direction: UP,
  })
  return tankId
}

function* watchEagle() {
  while (true) {
    yield take([A.DESTROY_EAGLE])
    console.debug('eagle-destroyed')
  }
}

// 该saga用来管理游戏进度
// 例如当前处于第几关, 当前得分
export default function* gameManager() {
  yield put({ type: A.LOAD_STAGE, name: 'test' })

  yield put({
    type: A.CREATE_PLAYER,
    playerName: 'player-1',
    lives: 3,
  })
  yield put({
    type: A.CREATE_PLAYER,
    playerName: 'player-2',
    lives: 3,
  })

  const [tankId1, tankId2] = yield [
    call(spawnTank, { x: 4 * BLOCK_SIZE, y: 12 * BLOCK_SIZE }),
    call(spawnTank, { x: 8 * BLOCK_SIZE, y: 12 * BLOCK_SIZE }),
  ]

  yield put({
    type: A.ACTIVATE_PLAYER,
    playerName: 'player-1',
    tankId: tankId1,
  })
  yield put({
    type: A.ACTIVATE_PLAYER,
    playerName: 'player-2',
    tankId: tankId2,
  })
  // todo 生成AI
  yield fork(watchEagle)
}
