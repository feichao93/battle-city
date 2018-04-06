import React from 'react'
import createSgaMiddleware, { Task } from 'redux-saga'
import { createStore, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'
import identity from 'lodash/identity'

export default function saga(reducerFn: any, preloadedState: any, sagaFn: any): any {
  return function(Component: any) {
    const Connected = connect(identity)(Component)
    return class extends React.PureComponent {
      task: Task
      store: any

      constructor() {
        super()
        const sagaMiddleware = createSgaMiddleware()
        this.store = createStore(reducerFn, preloadedState, applyMiddleware(sagaMiddleware))
        this.task = sagaMiddleware.run(sagaFn)
      }

      componentWillUnmount() {
        this.task.cancel()
      }

      render() {
        return (
          <Provider store={this.store}>
            <Connected />
          </Provider>
        )
      }
    }
  }
}
