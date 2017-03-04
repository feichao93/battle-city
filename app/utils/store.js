import { createStore, applyMiddleware } from 'redux'
import createSgaMiddleware from 'redux-saga'
import reducer from 'reducers/index'

import rootSaga from 'sagas/index'

const sagaMiddleware = createSgaMiddleware()

export default createStore(reducer,
  applyMiddleware(sagaMiddleware))

sagaMiddleware.run(rootSaga)
