import * as React from 'react'
import { hot } from 'react-hot-loader'
import { Route } from 'react-router-dom'
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

const BuildInfo = () => (
  <div style={{ maxWidth: 200, marginLeft: 20 }}>
    <p>当前版本 {COMPILE_VERSION}</p>
    <p>编译时间 {COMPILE_DATE}</p>
    <p>
      游戏仍在开发中，目前只支持单人进行游戏。 目前游戏仍有很多BUG，请见谅。
      请使用最新的chrome浏览器。 整个游戏都使用了矢量图，可以适当放大浏览器的缩放比例。
    </p>
    <p>WASD 控制坦克方向</p>
    <p>J 控制开火</p>
    <p>
      使用<a href="./editor.html" target="_blank">
        编辑器
      </a>创建自己喜欢的地图
    </p>
    <p>
      在<a href="./stories.html" target="_blank">
        stories页面
      </a>浏览游戏中的组件/素材
    </p>
  </div>
)

const zoomLevel = 2
const totalWidth = 16 * B
const totalHeight = 15 * B

class App extends React.PureComponent<{ paused: boolean }> {
  render() {
    const { paused } = this.props

    return (
      <ConnectedRouter history={history}>
        {/* TODO gallery-page and editor-page */}
        <div style={{ display: 'flex' }}>
          <svg
            className="svg"
            style={{ background: '#757575' }}
            width={totalWidth * zoomLevel}
            height={totalHeight * zoomLevel}
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          >
            <Route exact path="/" component={GameTitleScene} />
            <Route path="/choose-stage" component={ChooseStageScene} />
            <Route exact path="/game" component={GameScene} />
            <Route exact path="/gameover" component={GameoverScene} />
            <Route exact path="/statistics" component={StatisticsScene} />
            <CurtainsContainer />
            {paused ? <PauseIndicator /> : null}
          </svg>
          {DEV.BUILD_INFO ? <BuildInfo /> : null}
          {DEV.INSPECTOR ? <Inspector /> : null}
        </div>
      </ConnectedRouter>
    )
  }
}

function mapStateToProps(state: State) {
  return { paused: state.game.paused }
}

export default hot(module)(connect(mapStateToProps)(App))
