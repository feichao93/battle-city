import React from 'react'
import { hot } from 'react-hot-loader'
import { Route, Redirect, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import { connect } from 'react-redux'
import history from 'utils/history'
import GameScene from 'components/GameScene'
import GameoverScene from 'components/GameoverScene'
import GameTitleScene from 'components/GameTitleScene'
import ChooseStageScene from 'components/ChooseStageScene'
import Editor from './components/Editor'
import StageListPageWrapper from './components/StageList'
import { State } from 'types'
import { GameRecord } from 'reducers/game'
import { firstStageName as fsn } from 'stages'
import Gallery from 'components/Gallery'

class App extends React.PureComponent<{ game: GameRecord }> {
  render() {
    return (
      <ConnectedRouter history={history}>
        <Switch>
          <Route path="/list" component={StageListPageWrapper} />
          <Route path="/editor" component={Editor} />
          <Route path="/gallery" component={Gallery} />
          <Route exact path="/gameover" component={GameoverScene} />
          <Route exact path="/choose" render={() => <Redirect to={`/choose/${fsn}`} />} />
          <Route path="/choose/:stageName" component={ChooseStageScene} />
          <Route exact path="/stage" render={() => <Redirect to={`/stage/${fsn}`} />} />
          <Route path="/stage/:stageName" component={GameScene} />
          <Route component={GameTitleScene} />
        </Switch>
      </ConnectedRouter>
    )
  }
}

function mapStateToProps(state: State) {
  return { game: state.game }
}

export default hot(module)(connect(mapStateToProps)(App))
