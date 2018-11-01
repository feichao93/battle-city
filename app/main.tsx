// 使用 core-js 作为一些高版本 ES 的函数的 polyfill
import 'core-js/fn/array/includes'
import 'core-js/fn/object/entries'
import 'core-js/fn/string/pad-end'
import 'core-js/fn/string/pad-start'
import 'normalize.css'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './battle-city.css'
import useProvider from './hooks/useProvider'
import ReduxContext from './ReduxContext'
import store from './utils/store'

function Main() {
  const render = useProvider(store, ReduxContext)

  return render(
    <div>
      <h1>{store.getState().game.status}</h1>
      <App />
    </div>,
  )
}

ReactDOM.render(<Main />, document.getElementById('container'))
