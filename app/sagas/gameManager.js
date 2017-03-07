import { delay } from 'redux-saga'
import { put, fork, take } from 'redux-saga/effects'
import * as A from 'utils/actions'
import { UP, TANK_SPAWN_DELAY, PLAYER_TANK_SPAWN_POSITION } from 'utils/constants'

let nextFlickerId = 1
let nextTankId = 1

function* spawnPlayerTank() {
  yield put({
    type: A.SPAWN_FLICKER,
    flickerId: nextFlickerId++,
    x: PLAYER_TANK_SPAWN_POSITION.x,
    y: PLAYER_TANK_SPAWN_POSITION.y,
  })
  yield delay(TANK_SPAWN_DELAY)
  const tankId = nextTankId
  nextTankId++
  yield put({
    type: A.SPAWN_TANK,
    tankId,
    x: PLAYER_TANK_SPAWN_POSITION.x,
    y: PLAYER_TANK_SPAWN_POSITION.y,
    direction: UP,
  })
  yield put({
    type: A.ACTIVATE_PLAYER,
    tankId,
  })
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

  yield fork(spawnPlayerTank)
  // todo 生成AI
  yield fork(watchEagle)
}
