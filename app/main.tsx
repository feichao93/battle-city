import 'normalize.css'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './battle-city.css'
import { Connect } from './hooks/useProvider'
import './polyfills'
import './preloading-images'
import ReduxContext from './ReduxContext'
import store from './utils/store'

ReactDOM.render(
  (
    <Connect store={store} context={ReduxContext}>
      <App />
    </Connect>
  ) as any,
  document.getElementById('container'),
)
