import React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { replace } from 'react-router-redux'
import { ITEM_SIZE_MAP, BLOCK_SIZE as B } from 'utils/constants'
import BrickWall from 'components/BrickWall'
import Text from 'components/Text'
import TextButton from 'components/TextButton'
import { GameRecord } from 'reducers/game'
import { State } from 'reducers'

class GameoverScene extends React.PureComponent<{ dispatch: Dispatch<State>; game: GameRecord }> {
  componentDidMount() {
    document.addEventListener('keypress', this.handleKeyPress)
    const { game, dispatch } = this.props
    if (game.status === 'idle') {
      dispatch(replace('/'))
    }
    // 这里不考虑这种情况：玩家在游戏过程中手动在地址栏中输入了 /gameover
  }

  componentWillUnmount() {
    document.removeEventListener('keypress', this.handleKeyPress)
  }

  handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'r') {
      this.onRestart()
    }
  }

  onRestart = () => {
    const { game, dispatch } = this.props
    if (game.lastStage) {
      dispatch(replace(`/choose-stage/${game.lastStage}`))
    } else {
      dispatch(replace(`/choose-stage`))
    }
  }

  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    return (
      <g className="gameover-scene">
        <defs>
          <pattern
            id="pattern-brickwall"
            width={size * 2 / scale}
            height={size * 2 / scale}
            patternUnits="userSpaceOnUse"
          >
            <g transform={`scale(${1 / scale})`}>
              <BrickWall x={0} y={0} />
              <BrickWall x={0} y={size} />
              <BrickWall x={size} y={0} />
              <BrickWall x={size} y={size} />
            </g>
          </pattern>
        </defs>
        <rect fill="#000000" x={0} y={0} width={16 * B} height={15 * B} />
        <g transform={`scale(${scale})`}>
          <Text content="game" x={4 * B / scale} y={4 * B / scale} fill="url(#pattern-brickwall)" />
          <Text content="over" x={4 * B / scale} y={7 * B / scale} fill="url(#pattern-brickwall)" />
        </g>
        <g transform={`translate(${5.75 * B}, ${13 * B}) scale(0.5)`}>
          <TextButton
            content="press R to restart"
            x={0}
            y={0}
            textFill="#9ed046"
            onClick={this.onRestart}
          />
        </g>
      </g>
    )
  }
}

export default connect((state: State) => ({ game: state.game }))(GameoverScene)
