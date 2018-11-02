import React from 'react'
import { Redirect, Route, Router, Switch } from 'react-router-dom'
import About from './components/About'
import ChooseStageScene from './components/ChooseStageScene'
import Inspector from './components/dev-only/Inspector'
import Editor from './components/Editor'
import Gallery from './components/Gallery'
import GameoverScene from './components/GameoverScene'
import GameScene from './components/GameScene'
import GameTitleScene from './components/GameTitleScene'
import StageList from './components/StageList'
import { firstStageName as fsn } from './stages'
import history from './utils/history'

const App = () => (
  <Router history={history}>
    <div style={{ display: 'flex' }}>
      <Switch>
        <Route path="/list" component={StageList as any} />
        <Route path="/editor" component={Editor as any} />
        <Route path="/gallery" component={Gallery as any} />
        <Route exact path="/gameover" component={GameoverScene as any} />
        <Route
          exact
          path="/choose"
          render={({ location }) => <Redirect to={`/choose/${fsn}${location.search}`} />}
        />
        <Route path="/choose/:stageName" component={ChooseStageScene as any} />
        <Route
          exact
          path="/stage"
          render={({ location }) => <Redirect to={`/stage/${fsn}${location.search}`} />}
        />
        <Route path="/stage/:stageName" component={GameScene as any} />
        <Route component={GameTitleScene as any} />
      </Switch>
      {DEV.HIDE_ABOUT ? null : <About />}
      {DEV.INSPECTOR && <Inspector />}
    </div>
  </Router>
)

export default App
