import { createStore, applyMiddleware } from 'redux'
import { routerMiddleware } from 'react-router-redux'
import createSgaMiddleware from 'redux-saga'
import history from 'utils/history'
import reducer from 'reducers/index'

import rootSaga from 'sagas/index'

const sagaMiddleware = createSgaMiddleware()

export default createStore(reducer, applyMiddleware(routerMiddleware(history), sagaMiddleware))

sagaMiddleware.run(rootSaga)
