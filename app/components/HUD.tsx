import React from 'react'
import { connect } from 'react-redux'
import EnemyCountIndicator from 'components/EnemyCountIndicator'
import { PlayerTankThumbnail } from 'components/icons'
import Text from 'components/Text'
import { BLOCK_SIZE as B, FIELD_SIZE } from 'utils/constants'
import { State, PlayersMap } from 'types'

interface HUDContentProps {
  x?: number
  y?: number
  remainingEnemyCount: number
  players: PlayersMap
  show: boolean
}

export class HUDContent extends React.PureComponent<HUDContentProps> {
  renderPlayer1Info() {
    const { players } = this.props
    const player1 = players.get('player-1')
    if (player1 == null) {
      return null
    } else {
      return (
        <g className="player-1-info">
          <Text x={0} y={0} content={'\u2160P'} fill="#000000" />
          <PlayerTankThumbnail x={0} y={0.5 * B} />
          <Text x={0.5 * B} y={0.5 * B} content={String(player1.lives)} fill="#000000" />
        </g>
      )
    }
  }

  renderPlayer2Info() {
    const { players } = this.props
    const player2 = players.get('player-2')
    if (player2 == null) {
      return null
    } else {
      const transform = `translate(0, ${B})`
      return (
        <g className="player-2-info" transform={transform}>
          <Text x={0} y={0} content={'\u2161P'} fill="#000000" />
          <PlayerTankThumbnail x={0} y={0.5 * B} />
          <Text x={0.5 * B} y={0.5 * B} content={String(player2.lives)} fill="#000000" />
        </g>
      )
    }
  }

  render() {
    const { remainingEnemyCount, show, x = 0, y = 0 } = this.props

    return (
      <g className="HUD" display={show ? 'inline' : 'none'} transform={`translate(${x}, ${y})`}>
        <EnemyCountIndicator count={remainingEnemyCount} />
        <g transform={`translate(0, ${6 * B})`}>
          {this.renderPlayer1Info()}
          {this.renderPlayer2Info()}
        </g>
      </g>
    )
  }
}

function mapStateToProps(state: State) {
  return {
    remainingEnemyCount: state.game.remainingEnemies.size,
    players: state.players,
    show: state.game.showHUD,
  }
}

export default connect(mapStateToProps)(props => (
  <HUDContent x={FIELD_SIZE + 1.5 * B} y={1.5 * B} {...props} />
))
