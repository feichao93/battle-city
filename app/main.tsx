/// <reference path="../custom-tyings.d.ts" />
import 'normalize.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import store from 'utils/store'
import App from './App'

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('container'),
)

// 自定义的react类型信息
declare module 'react' {
  interface SVGProps<T> {
    role?: string
  }
}
