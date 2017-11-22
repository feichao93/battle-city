import 'normalize.css'
import * as React from 'react'
import { ComponentClass } from 'react'
import * as ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { Provider } from 'react-redux'
import store from 'utils/store'
import App from './App'

function render(Component: ComponentClass) {
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <Component />
      </Provider>
    </AppContainer>,
    document.getElementById('container'),
  )
}

// initial render
render(App)

declare const module: any
if (module.hot) {
  module.hot.accept('./App.tsx', () => {
    // hot-reload for App
    render(require('./App').default)
  })
}

// 自定义的react类型信息
declare module 'react' {
  interface SVGProps<T> {
    role?: string
  }
}

declare global {
  const COMPILE_VERSION: string
  const COMPILE_DATE: string
  const DEV: boolean
}
