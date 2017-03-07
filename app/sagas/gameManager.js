import { delay } from 'redux-saga'
import { put, fork } from 'redux-saga/effects'
import * as A from 'utils/actions'
import { UP, BLOCK_SIZE, TANK_SPAWN_DELAY } from 'utils/constants'

let nextFlickerId = 1

function* spawnPlayer() {
  yield put({
    type: A.SPAWN_FLICKER,
    flickerId: nextFlickerId++,
    x: 4 * BLOCK_SIZE,
    y: 12 * BLOCK_SIZE,
  })
  yield delay(TANK_SPAWN_DELAY)
  yield put({
    type: A.SPAWN_PLAYER,
    x: 4 * BLOCK_SIZE,
    y: 12 * BLOCK_SIZE,
    direction: UP,
  })
}

// 该saga用来管理游戏进度
// 例如当前处于第几关, 当前得分
export default function* gameManager() {
  yield put({ type: A.LOAD_STAGE, name: 'test' })

  yield fork(spawnPlayer)
  // todo 生成AI
}
