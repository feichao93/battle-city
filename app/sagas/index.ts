import { put, takeEvery, takeLatest } from 'redux-saga/effects'
import gameSaga from './gameSaga'
import { syncFrom, syncTo } from './syncLocalStorage'

export default function* rootSaga() {
  DEV.LOG && console.log('root saga started')

  yield syncFrom()
  yield takeEvery('SYNC_CUSTOM_STAGES', syncTo)
  yield takeLatest(['START_GAME', 'RESET_GAME'], gameSaga)

  if (DEV.SKIP_CHOOSE_STAGE) {
    yield put<Action>({ type: 'START_GAME', stageIndex: 0 })
  }
}
