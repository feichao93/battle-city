import React from 'react'
import { hot } from 'react-hot-loader'
import { connect } from 'react-redux'
import { Redirect, Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import About from './components/About'
import ChooseStageScene from './components/ChooseStageScene'
import Inspector from './components/dev-only/Inspector'
import Editor from './components/Editor'
import Gallery from './components/Gallery'
import GameoverScene from './components/GameoverScene'
import GameScene from './components/GameScene'
import GameTitleScene from './components/GameTitleScene'
import StageListPageWrapper from './components/StageList'
import { GameRecord } from './reducers/game'
import { firstStageName as fsn } from './stages'
import { State } from './types'
import history from './utils/history'

class App extends React.PureComponent<{ game: GameRecord }> {
  render() {
    return (
      <ConnectedRouter history={history}>
        <div style={{ display: 'flex' }}>
          <Switch>
            <Route path="/list" component={StageListPageWrapper} />
            <Route path="/editor" component={Editor} />
            <Route path="/gallery" component={Gallery} />
            <Route exact path="/gameover" component={GameoverScene} />
            <Route
              exact
              path="/choose"
              render={({ location }) => <Redirect to={`/choose/${fsn}${location.search}`} />}
            />
            <Route path="/choose/:stageName" component={ChooseStageScene} />
            <Route
              exact
              path="/stage"
              render={({ location }) => <Redirect to={`/stage/${fsn}${location.search}`} />}
            />
            <Route path="/stage/:stageName" component={GameScene} />
            <Route component={GameTitleScene} />
          </Switch>
          {DEV.HIDE_ABOUT ? null : <About />}
          {DEV.INSPECTOR && <Inspector />}
        </div>
      </ConnectedRouter>
    )
  }
}

function mapStateToProps(state: State) {
  return { game: state.game }
}

export default hot(module)(connect(mapStateToProps)(App))
