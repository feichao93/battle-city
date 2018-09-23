import React from 'react'
import { connect } from 'react-redux'
import { GameRecord } from '../reducers/game'
import { State, TankRecord } from '../types'
import { BLOCK_SIZE as B } from '../utils/constants'
import * as selectors from '../utils/selectors'
import PauseIndicator from './PauseIndicator'
import Screen from './Screen'
import { Tank } from './tanks'
import Text from './Text'

export interface StatisticsSceneProps {
  game: GameRecord
  inMultiPlayersMode: boolean
  player1Score: number
  player2Score: number
}

export class StatisticsSceneContent extends React.PureComponent<StatisticsSceneProps> {
  renderPlayer1KillInfo() {
    const { player1Score } = this.props
    const { transientKillInfo, showTotalKillCount } = this.props.game

    const info = transientKillInfo.get('player-1')

    const basic = info.get('basic')
    const basicCountStr = basic === -1 ? '  ' : String(basic).padStart(2)
    const basicPointsStr = basic === -1 ? '    ' : String(basic * 100).padStart(4)

    const fast = info.get('fast')
    const fastCountStr = fast === -1 ? '  ' : String(fast).padStart(2)
    const fastPointsStr = fast === -1 ? '    ' : String(fast * 200).padStart(4)

    const power = info.get('power')
    const powerCountStr = power === -1 ? '  ' : String(power).padStart(2)
    const powerPointsStr = power === -1 ? '    ' : String(power * 300).padStart(4)

    const armor = info.get('armor')
    const armorCountStr = armor === -1 ? '  ' : String(armor).padStart(2)
    const armorPointsStr = armor === -1 ? '    ' : String(armor * 400).padStart(4)

    let totalStr = '  '
    if (showTotalKillCount) {
      totalStr = String(basic + fast + power + armor).padStart(2)
    }

    return (
      <g>
        <Text content={'\u2160-PLAYER'} x={2 * B} y={5.5 * B} fill="#e44437" />
        <Text content={String(player1Score).padStart(8)} x={2 * B} y={6.5 * B} fill="#feac4e" />
        <Text
          content={`${basicPointsStr} PTS ${basicCountStr}\u2190`}
          x={2 * B}
          y={8 * B}
          fill="white"
        />
        <Text
          content={`${fastPointsStr} PTS ${fastCountStr}\u2190`}
          x={2 * B}
          y={9.5 * B}
          fill="white"
        />
        <Text
          content={`${powerPointsStr} PTS ${powerCountStr}\u2190`}
          x={2 * B}
          y={11 * B}
          fill="white"
        />
        <Text
          content={`${armorPointsStr} PTS ${armorCountStr}\u2190`}
          x={2 * B}
          y={12.5 * B}
          fill="white"
        />

        <Text content={`TOTAL ${totalStr}`} x={3.5 * B} y={13.75 * B} fill="white" />
      </g>
    )
  }

  renderPlayer2KillInfo() {
    if (!this.props.inMultiPlayersMode) {
      return null
    }
    const { player2Score } = this.props
    const { transientKillInfo, showTotalKillCount } = this.props.game

    const info = transientKillInfo.get('player-2')

    const basic = info.get('basic')
    const basicCountStr = basic === -1 ? '  ' : String(basic).padEnd(2)
    const basicPointsStr = basic === -1 ? '    ' : String(basic * 100).padEnd(4)

    const fast = info.get('fast')
    const fastCountStr = fast === -1 ? '  ' : String(fast).padEnd(2)
    const fastPointsStr = fast === -1 ? '    ' : String(fast * 200).padEnd(4)

    const power = info.get('power')
    const powerCountStr = power === -1 ? '  ' : String(power).padEnd(2)
    const powerPointsStr = power === -1 ? '    ' : String(power * 300).padEnd(4)

    const armor = info.get('armor')
    const armorCountStr = armor === -1 ? '  ' : String(armor).padEnd(2)
    const armorPointsStr = armor === -1 ? '    ' : String(armor * 400).padEnd(4)

    let totalStr = '  '
    if (showTotalKillCount) {
      totalStr = String(basic + fast + power + armor).padEnd(2)
    }

    return (
      <g>
        <Text content={'\u2161-PLAYER'} x={11.5 * B} y={5.5 * B} fill="#e44437" />
        <Text content={String(player2Score)} x={11.5 * B} y={6.5 * B} fill="#feac4e" />
        <Text
          content={`\u2192 ${basicCountStr} PTS ${basicPointsStr}`}
          x={9 * B}
          y={8 * B}
          fill="white"
        />
        <Text
          content={`\u2192 ${fastCountStr} PTS ${fastPointsStr}`}
          x={9 * B}
          y={9.5 * B}
          fill="white"
        />
        <Text
          content={`\u2192 ${powerCountStr} PTS ${powerPointsStr}`}
          x={9 * B}
          y={11 * B}
          fill="white"
        />
        <Text
          content={`\u2192 ${armorCountStr} PTS ${armorPointsStr}`}
          x={9 * B}
          y={12.5 * B}
          fill="white"
        />

        <Text content={`${totalStr} TOTAL`} x={10 * B} y={13.75 * B} fill="white" />
      </g>
    )
  }

  render() {
    const {
      game: { currentStageName },
    } = this.props

    return (
      <g>
        <rect fill="#000000" width={16 * B} height={15 * B} />
        <g transform={`translate(${-0.5 * B}, ${-1.5 * B})`}>
          <Text content="HI-SCORE" x={4.5 * B} y={3.5 * B} fill="#e44437" />
          <Text content="20000" x={10 * B} y={3.5 * B} fill="#feac4e" />
          <Text content={`STAGE  ${currentStageName}`} x={6.5 * B} y={4.5 * B} fill="#ffffff" />

          {/* 中间的4辆坦克 & 白线 */}
          <Tank tank={new TankRecord({ x: 8 * B, y: 7.7 * B, side: 'bot', level: 'basic' })} />
          <Tank tank={new TankRecord({ x: 8 * B, y: 9.2 * B, side: 'bot', level: 'fast' })} />
          <Tank tank={new TankRecord({ x: 8 * B, y: 10.7 * B, side: 'bot', level: 'power' })} />
          <Tank tank={new TankRecord({ x: 8 * B, y: 12.2 * B, side: 'bot', level: 'armor' })} />
          <rect x={6.5 * B} y={13.3 * B} width={4 * B} height={2} fill="white" />

          {this.renderPlayer1KillInfo()}
          {this.renderPlayer2KillInfo()}
        </g>
      </g>
    )
  }
}

class StatisticsScene extends React.PureComponent<StatisticsSceneProps> {
  render() {
    const { game } = this.props

    return (
      <Screen>
        <rect fill="#000000" x={0} y={0} width={16 * B} height={16 * B} />
        <StatisticsSceneContent {...this.props} />
        {game.paused ? <PauseIndicator x={6.25 * B} y={8 * B} /> : null}
      </Screen>
    )
  }
}

function mapStateToProps(state: State) {
  return {
    game: state.game,
    player1Score: state.player1.score,
    player2Score: state.player2.score,
    inMultiPlayersMode: selectors.isInMultiPlayersMode(state),
  }
}

export default connect(mapStateToProps)(StatisticsScene)
