import * as React from 'react'
import { hot } from 'react-hot-loader'
import { Route, Redirect, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import { connect } from 'react-redux'
import { BLOCK_SIZE as B } from 'utils/constants'
import history from 'utils/history'
import GameScene from 'components/GameScene'
import GameoverScene from 'components/GameoverScene'
import StatisticsScene from 'components/StatisticsScene'
import GameTitleScene from 'components/GameTitleScene'
import ChooseStageScene from 'components/ChooseStageScene'
import PauseIndicator from 'components/PauseIndicator'
import CurtainsContainer from 'components/CurtainsContainer'
import Inspector from 'components/dev-only/Inspector'
import { State } from 'types'
import { GameRecord } from 'reducers/game'
import { stageNames } from 'stages'
import Editor from './editor'

const About = () => (
  <div
    style={{
      maxWidth: 200,
      marginLeft: 20,
      fontFamily: 'consolas, Microsoft Yahei, monospaced',
      lineHeight: 1.5,
    }}
  >
    <p>
      当前版本 <br />
      {COMPILE_VERSION}
    </p>
    <p>
      编译时间 <br />
      {COMPILE_DATE}
    </p>
    <p>
      游戏仍在开发中，目前只支持单人进行游戏，也包含许多
      <a
        href="https://github.com/shinima/battle-city/issues"
        target="_blank"
        style={{ color: 'red' }}
      >
        BUG
      </a>。 整个游戏都采用了矢量图，请使用最新的 chrome
      浏览器，并适当调整浏览器的缩放比例，以获得最好的游戏体验。
    </p>
    <p style={{ fontWeight: 'bold' }}>WASD 控制坦克方向</p>
    <p style={{ fontWeight: 'bold' }}>J 控制开火</p>
    <p style={{ fontWeight: 'bold' }}>请使用鼠标控制其他部分</p>
  </div>
)

const zoomLevel = 2
const totalWidth = 16 * B
const totalHeight = 15 * B

class App extends React.PureComponent<{ game: GameRecord }> {
  render() {
    const { game } = this.props

    return (
      <ConnectedRouter history={history}>
        <Switch>
          <Route path="/editor" component={Editor} />
          {/* TODO <Route path="/gallery" component={Gallery} /> */}
          <Route
            render={() => (
              <div style={{ display: 'flex' }}>
                <svg
                  className="svg"
                  style={{ background: '#757575' }}
                  width={totalWidth * zoomLevel}
                  height={totalHeight * zoomLevel}
                  viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                >
                  <Switch>
                    <Route
                      exact
                      path="/choose-stage"
                      render={() => <Redirect to={`/choose-stage/${stageNames[0]}`} />}
                    />
                    <Route path="/choose-stage/:stageName" component={ChooseStageScene} />
                    <Route
                      exact
                      path="/stage"
                      render={() => <Redirect to={`/stage/${stageNames[0]}`} />}
                    />
                    <Route
                      path="/stage/:stageName"
                      render={({ match }) =>
                        game.status === 'stat' ? <StatisticsScene /> : <GameScene match={match} />
                      }
                    />
                    <Route
                      render={() =>
                        game.status === 'gameover' ? <GameoverScene /> : <GameTitleScene />
                      }
                    />
                  </Switch>
                  <CurtainsContainer />
                  {game.paused ? <PauseIndicator /> : null}
                </svg>
                {DEV.HIDE_ABOUT ? null : <About />}
                {DEV.INSPECTOR ? <Inspector /> : null}
              </div>
            )}
          />
        </Switch>
      </ConnectedRouter>
    )
  }
}

function mapStateToProps(state: State) {
  return { game: state.game }
}

export default hot(module)(connect(mapStateToProps)(App))
