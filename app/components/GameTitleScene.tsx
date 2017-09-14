import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import BrickWall from 'components/BrickWall'
import Text from 'components/Text'
import TextButton from 'components/TextButton'
import { Tank } from 'components/tanks'
import { ITEM_SIZE_MAP, BLOCK_SIZE as B, CONTROL_CONFIG } from 'utils/constants'
import { TankRecord, State } from 'types'

type Choice = '1-player' | '2-players' | 'editor'

function y(choice: Choice) {
  if (choice === '1-player') {
    return 8.25 * B
  } else if (choice === '2-players') {
    return 9.25 * B
  } else {
    return 10.25 * B
  }
}

function nextChoice(choice: Choice) {
  if (choice === '1-player') {
    return '2-players'
  } else if (choice === '2-players') {
    return 'editor'
  } else {
    return '1-player'
  }
}

function prevChoice(choice: Choice) {
  if (choice === '1-player') {
    return 'editor'
  } else if (choice === '2-players') {
    return '1-player'
  } else {
    return '2-players'
  }
}

interface P {
  dispatch: Dispatch<State>
}

interface S {
  choice: Choice
}

class GameTitleScene extends React.PureComponent<P, S> {
  state = {
    choice: '1-player' as Choice,
  }

  componentDidMount() {
    document.addEventListener('keypress', this.handleKeyPress)
  }

  componentWillUnmount() {
    document.removeEventListener('keypress', this.handleKeyPress)
  }

  handleKeyPress = (event: KeyboardEvent) => {
    const { dispatch } = this.props
    const { choice } = this.state
    const config = CONTROL_CONFIG.player1
    if (event.key === config.down) {
      this.setState({ choice: nextChoice(choice) })
    } else if (event.key === config.up) {
      this.setState({ choice: prevChoice(choice) })
    } else if (event.key === config.fire) {
      if (choice === '1-player') {
        dispatch<Action>({ type: 'GAMESTART' })
      }
    }
  }

  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    const { choice } = this.state
    return (
      <g role="game-title-scene">
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
        <rect
          fill="#000000"
          width={16 * B}
          height={15 * B}
        />
        <g transform="scale(0.5)">
          <TextButton
            textFill="#607d8b"
            x={22 * B}
            y={B}
            content="star me on github"
            onClick={() => window.open('https://github.com/shinima/battle-city')}
          />
        </g>
        <Text
          content={'\u2160-    00 HI- 20000'}
          x={1 * B}
          y={1.5 * B}
        />
        <g transform={`scale(${scale})`}>
          <Text
            content="battle"
            x={1.5 * B / scale}
            y={3 * B / scale}
            fill="url(#pattern-brickwall)"
          />
          <Text
            content="city"
            x={3.5 * B / scale + 1}
            y={5.5 * B / scale}
            fill="url(#pattern-brickwall)"
          />
        </g>
        <Text
          content="1 player"
          x={5.5 * B}
          y={8.5 * B}
          fill="white"
        />
        <Text
          content="2 players"
          x={5.5 * B}
          y={9.5 * B}
          fill="white"
        />
        <Text
          content="editor"
          x={5.5 * B}
          y={10.5 * B}
          fill="white"
        />
        <Tank tank={TankRecord({
          side: 'human',
          direction: 'right',
          color: 'yellow',
          moving: true,
          x: 4 * B,
          y: y(choice),
        })} />

        <Text
          content={'\u00a9 1980 1985 NAMCO LTD.'}
          x={2 * B}
          y={12.5 * B}
        />
        <Text
          content="ALL RIGHTS RESERVED"
          x={3 * B}
          y={13.5 * B}
        />
      </g>
    )
  }
}

export default connect(undefined)(GameTitleScene)
