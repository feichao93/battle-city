import * as React from 'react'
import { connect } from 'react-redux'
import { BLOCK_SIZE as B } from 'utils/constants'
import GameScene from 'components/GameScene'
import GameoverScene from 'components/GameoverScene'
import StatisticsScene from 'components/StatisticsScene'
import GameTitleScene from 'components/GameTitleScene'
import { State } from 'types'

const zoomLevel = 2
const totalWidth = 16 * B
const totalHeight = 15 * B

class App extends React.PureComponent<{ scene: Scene }> {
  render() {
    const { scene } = this.props

    return (
      <svg
        className="svg"
        style={{ background: '#757575' }}
        width={totalWidth * zoomLevel}
        height={totalHeight * zoomLevel}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      >
        {scene === 'game-title' ? <GameTitleScene /> : null}
        {scene === 'game' ? <GameScene /> : null}
        {scene === 'gameover' ? <GameoverScene /> : null}
        {scene === 'statistics' ? <StatisticsScene /> : null}
      </svg>
    )
  }
}

function mapStateToProps(state: State) {
  return {
    scene: state.game.scene,
  }
}

export default connect(mapStateToProps)(App)
