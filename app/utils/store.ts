import { applyMiddleware, createStore } from 'redux'
import createSgaMiddleware from 'redux-saga'
import reducer from '../reducers/index'
import rootSaga from '../sagas/index'

const sagaMiddleware = createSgaMiddleware()

const store = createStore(reducer, applyMiddleware(sagaMiddleware))

sagaMiddleware.run(rootSaga)

export default store
