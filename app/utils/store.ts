import { routerMiddleware } from 'react-router-redux'
import { applyMiddleware, createStore } from 'redux'
import createSgaMiddleware from 'redux-saga'
import reducer from '../reducers/index'
import rootSaga from '../sagas/index'
import history from '../utils/history'

const sagaMiddleware = createSgaMiddleware()

export default createStore(reducer, applyMiddleware(routerMiddleware(history), sagaMiddleware))

sagaMiddleware.run(rootSaga)
