import 'normalize.css'
import 'styles.styl'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { Provider } from 'react-redux'
import store from 'utils/store'
import App from './App'

ReactDOM.render(
  <AppContainer>
    <Provider store={store}>
      <App />
    </Provider>
  </AppContainer>,
  document.getElementById('container'),
)

declare const module: any
// hot-reload for App
if (module.hot) {
  module.hot.accept('./App.tsx', () => {
    /* eslint-disable global-require, react/require-extension */
    const NewApp = require('./App').default

    ReactDOM.render(
      <AppContainer>
        <Provider store={store}>
          <NewApp />
        </Provider>
      </AppContainer>,
      document.getElementById('container'),
    )
  })
}

// 自定义的react类型信息
declare module 'react' {
  interface SVGProps<T> {
    role?: string
  }
}
