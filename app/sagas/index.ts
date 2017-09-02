import { delay } from 'redux-saga'
import { fork, put, takeEvery } from 'redux-saga/effects'
import humanController from 'sagas/humanController'
import bulletsSaga from 'sagas/bulletsSaga'
import gameManager from 'sagas/gameManager'
import AIMasterSaga from 'sagas/AISaga'
import tickEmitter from 'sagas/tickEmitter'
import { CONTROL_CONFIG, TANK_SPAWN_DELAY } from 'utils/constants'
import { frame as f } from 'utils/common'
import humanPlayerSaga from 'sagas/humanPlayerSaga'
import powerUps from 'sagas/powerUps'

function* autoRemoveEffects() {
  yield takeEvery('SPAWN_EXPLOSION', function* removeExplosion({ explosionId, explosionType }: Action.SpawnExplosionAction) {
    if (explosionType === 'bullet') {
      yield delay(200)
    } else if (explosionType === 'tank') {
      yield delay(500)
    }
    yield put<Action>({ type: 'REMOVE_EXPLOSION', explosionId })
  })
  yield takeEvery('ADD_SCORE', function* removeScore({ score: { scoreId } }: Action.AddScoreAction) {
    yield delay(f(48))
    yield put<Action>({ type: 'REMOVE_SCORE', scoreId })
  })
}

export default function* rootSaga() {
  console.debug('root saga started')
  yield fork(tickEmitter)

  yield fork(bulletsSaga)
  yield fork(autoRemoveEffects)
  yield fork(powerUps)

  // 生成两个humanController, 对应现实生活的游戏控制器
  yield fork(humanController, 'player-1', CONTROL_CONFIG.player1)
  yield fork(humanController, 'player-2', CONTROL_CONFIG.player2)

  yield fork(AIMasterSaga)

  yield fork(humanPlayerSaga, 'player-1', 'yellow')
  // yield fork(humanPlayerSaga, 'player-2')

  yield fork(gameManager)
}
