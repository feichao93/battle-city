import { delay } from 'redux-saga'
import { put, fork, take, join } from 'redux-saga/effects'
import * as A from 'utils/actions'
import {
  UP,
  TANK_SPAWN_DELAY,
  PLAYER1_TANK_SPAWN_POSITION,
  PLAYER2_TANK_SPAWN_POSITION,
  SIDE,
} from 'utils/constants'

let nextFlickerId = 1
let nextTankId = 1

function* spawnTank({ x, y }) {
  yield put({
    type: A.SPAWN_FLICKER,
    flickerId: nextFlickerId++,
    x,
    y,
  })
  yield delay(TANK_SPAWN_DELAY)
  const tankId = nextTankId
  nextTankId++
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

  const task1 = yield fork(spawnTank, PLAYER1_TANK_SPAWN_POSITION)
  const task2 = yield fork(spawnTank, PLAYER2_TANK_SPAWN_POSITION)
  const [tankId1, tankId2] = yield join([task1, task2])

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
