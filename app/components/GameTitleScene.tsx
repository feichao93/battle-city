import React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import BrickWall from 'components/BrickWall'
import Text from 'components/Text'
import TextButton from 'components/TextButton'
import { Tank } from 'components/tanks'
import { BLOCK_SIZE as B, CONTROL_CONFIG, ITEM_SIZE_MAP } from 'utils/constants'
import { State, TankRecord } from 'types'
import { GameRecord } from 'reducers/game'
import About from './About'
import FlexDiv from './FlexDiv'
import Screen from './Screen'

type Choice = '1-player' | 'stage-list' | 'gallery'

function nextChoice(choice: Choice): Choice {
  if (choice === '1-player') {
    return 'stage-list'
  } else if (choice === 'stage-list') {
    return 'gallery'
  } else {
    return '1-player'
  }
}

function prevChoice(choice: Choice): Choice {
  if (choice === '1-player') {
    return 'gallery'
  } else if (choice === 'stage-list') {
    return '1-player'
  } else {
    return 'stage-list'
  }
}

function y(choice: Choice) {
  if (choice === '1-player') {
    return 8.25 * B
  } else if (choice === 'stage-list') {
    return 9.25 * B
  } else {
    return 10.25 * B
  }
}

interface P {
  dispatch: Dispatch<State>
  game: GameRecord
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
    const { choice } = this.state
    const config = CONTROL_CONFIG.player1
    if (event.key === config.down) {
      this.setState({ choice: nextChoice(choice) })
    } else if (event.key === config.up) {
      this.setState({ choice: prevChoice(choice) })
    } else if (event.key === config.fire) {
      this.onChoose(choice)
    }
  }

  onChoose = (choice: Choice) => {
    const { dispatch } = this.props
    if (choice === 'stage-list') {
      dispatch(push('/list'))
    } else if (choice === '1-player') {
      dispatch(push('/choose'))
    } else {
      dispatch(push('/gallery'))
    }
  }

  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    const { choice } = this.state
    return (
      <FlexDiv>
        <Screen>
          <g className="game-title-scene">
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
            <rect fill="#000000" width={16 * B} height={15 * B} />
            <g transform="scale(0.5)">
              <TextButton
                textFill="#96d332"
                x={22 * B}
                y={B}
                content="star me on github"
                onClick={() => window.open('https://github.com/shinima/battle-city')}
              />
            </g>
            <Text content={'\u2160-    00 HI- 20000'} x={1 * B} y={1.5 * B} />
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
            <TextButton
              content="1 player"
              x={5.5 * B}
              y={8.5 * B}
              textFill="white"
              onMouseOver={() => this.setState({ choice: '1-player' })}
              onClick={() => this.onChoose('1-player')}
            />
            <TextButton
              content="stage list"
              x={5.5 * B}
              y={9.5 * B}
              textFill="white"
              onMouseOver={() => this.setState({ choice: 'stage-list' })}
              onClick={() => this.onChoose('stage-list')}
            />
            <TextButton
              content="gallery"
              x={5.5 * B}
              y={10.5 * B}
              textFill="white"
              onMouseOver={() => this.setState({ choice: 'gallery' })}
              onClick={() => this.onChoose('gallery')}
            />
            <Tank
              tank={
                new TankRecord({
                  side: 'human',
                  direction: 'right',
                  color: 'yellow',
                  moving: true,
                  x: 4 * B,
                  y: y(choice),
                })
              }
            />

            <Text content={'\u00a9 1980 1985 NAMCO LTD.'} x={2 * B} y={12.5 * B} />
            <Text content="ALL RIGHTS RESERVED" x={3 * B} y={13.5 * B} />
          </g>
        </Screen>
        {DEV.HIDE_ABOUT ? null : <About />}
      </FlexDiv>
    )
  }
}

export default connect((state: State) => ({ game: state.game }))(GameTitleScene)
