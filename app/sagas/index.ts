import { fork, put, takeLatest } from 'redux-saga/effects'
import gameSaga from 'sagas/gameSaga'
import tickEmitter from 'sagas/tickEmitter'

export default function* rootSaga() {
  DEV.LOG && console.log('root saga started')
  // tickEmitter 是后台服务
  yield fork(tickEmitter, Infinity, true)

  yield takeLatest('GAMESTART', gameSaga)

  if (DEV.SKIP_CHOOSE_STAGE) {
    yield put<Action>({ type: 'GAMESTART', stageIndex: 0 })
  }
}
