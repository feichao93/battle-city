import identity from 'lodash/identity'
import React from 'react'
import { connect, Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import createSgaMiddleware, { Task } from 'redux-saga'

export default function saga(sagaFn: any, reducerFn: any, preloadedState?: any): any {
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
