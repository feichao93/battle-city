import { delay, takeEvery } from 'redux-saga'
import { fork, put } from 'redux-saga/effects'
import humanController from 'sagas/humanController'
import bulletsSaga from 'sagas/bulletsSaga'
import gameManager from 'sagas/gameManager'
import AIMasterSaga from 'sagas/AISaga'
import tickEmitter from 'sagas/tickEmitter'
import { CONTROL_CONFIG, TANK_SPAWN_DELAY } from 'utils/constants'

function* autoRemoveEffects() {
  yield takeEvery('SPAWN_EXPLOSION', function* removeExplosion({ explosionId, explosionType }: Action.SpawnExplosionAction) {
    if (explosionType === 'bullet') {
      yield delay(200)
    } else if (explosionType === 'tank') {
      yield delay(500)
    }
    yield put({ type: 'REMOVE_EXPLOSION', explosionId })
  })
  yield takeEvery('SPAWN_FLICKER', function* removeFlicker({ flickerId }: Action.SpawnFlickerAction) {
    yield delay(TANK_SPAWN_DELAY)
    yield put({ type: 'REMOVE_FLICKER', flickerId })
  })
}

export default function* rootSaga() {
  console.debug('root saga started')
  yield fork(tickEmitter)

  // 注意各个saga的启动顺序, 这将影响到后续action的put顺序
  yield fork(bulletsSaga)
  yield fork(autoRemoveEffects)

  // 生成两个humanController, 对应现实生活的游戏控制器
  yield fork(humanController, 'player-1', CONTROL_CONFIG.player1)
  yield fork(humanController, 'player-2', CONTROL_CONFIG.player2)

  yield fork(AIMasterSaga)

  yield fork(gameManager)
}
