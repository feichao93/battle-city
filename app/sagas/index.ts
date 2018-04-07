import { fork, put, takeLatest, takeEvery } from 'redux-saga/effects'
import gameSaga from 'sagas/gameSaga'
import tickEmitter from 'sagas/tickEmitter'
import { syncTo, syncFrom } from 'sagas/syncLocalStorage'

export default function* rootSaga() {
  DEV.LOG && console.log('root saga started')

  yield syncFrom()

  yield fork(tickEmitter, { bindESC: true })
  yield takeEvery('SYNC_CUSTOM_STAGES', syncTo)
  yield takeLatest(['START_GAME', 'RESET_GAME'], gameSaga)

  if (DEV.SKIP_CHOOSE_STAGE) {
    yield put<Action>({ type: 'START_GAME', stageIndex: 0 })
  }
}
