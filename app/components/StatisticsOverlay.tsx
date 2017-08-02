import * as React from 'react'
import { connect } from 'react-redux'
import { Map } from 'immutable'
import Text from 'components/Text'
import { Tank } from 'components/tanks'
import { BLOCK_SIZE as B } from 'utils/constants'
import { State } from 'reducers/index'

type P = {
  stageName: string
  /** 动画中的killInfo, killCount为-1表示这一行应该显示为空行 */
  transientKillInfo: Map<PlayerName, Map<TankLevel, KillCount>>
  showTotalKillCount: boolean
}

class StatisticsOverlay extends React.PureComponent<P> {
  render() {
    const { transientKillInfo, stageName, showTotalKillCount } = this.props
    const player1KillInfo = transientKillInfo.get('player-1')

    const basic = player1KillInfo.get('basic')
    const basicCountStr = basic === -1 ? '  ' : String(basic).padStart(2)
    const basicPointsStr = basic === -1 ? '    ' : String(basic * 100).padStart(4)

    const fast = player1KillInfo.get('fast')
    const fastCountStr = fast === -1 ? '  ' : String(fast).padStart(2)
    const fastPointsStr = fast === -1 ? '    ' : String(fast * 200).padStart(4)

    const power = player1KillInfo.get('power')
    const powerCountStr = power === -1 ? '  ' : String(power).padStart(2)
    const powerPointsStr = power === -1 ? '    ' : String(power * 300).padStart(4)

    const armor = player1KillInfo.get('armor')
    const armorCountStr = armor === -1 ? '  ' : String(armor).padStart(2)
    const armorPointsStr = armor === -1 ? '    ' : String(armor * 400).padStart(4)

    let player1Total = '  '
    if (showTotalKillCount) {
      const total = (basic === -1 ? 0 : basic)
        + (fast === -1 ? 0 : fast)
        + (power === -1 ? 0 : power)
        + (armor === -1 ? 0 : armor)
      player1Total = String(total).padStart(2)
    }

    return (
      <g role="statistics-overlay">
        <rect
          fill="#000000"
          x={0}
          y={0}
          width={16 * B}
          height={16 * B}
        />
        <g transform={`translate(${-0.5 * B}, ${-1.5 * B})`}>
          <Text content="HI-SCORE" x={4.5 * B} y={3.5 * B} fill="#e44437" />
          <Text content="20000" x={10 * B} y={3.5 * B} fill="#feac4e" />
          <Text content={`STAGE  ${stageName}`} x={6.5 * B} y={4.5 * B} fill="#ffffff" />

          {/* 中间的4辆坦克 & 白线 */}
          <Tank x={8 * B} y={7.7 * B} color="silver" side="ai" level="basic" direction="up" />
          <Tank x={8 * B} y={9.2 * B} color="silver" side="ai" level="fast" direction="up" />
          <Tank x={8 * B} y={10.7 * B} color="silver" side="ai" level="power" direction="up" />
          <Tank x={8 * B} y={12.2 * B} color="silver" side="ai" level="armor" direction="up" />
          <rect x={6.5 * B} y={13.3 * B} width={4 * B} height={2} fill="white" />

          {/* player-1的击杀统计 */}
          <Text content={'\u2160-PLAYER'} x={2 * B} y={5.5 * B} fill="#e44437" />
          <Text content="3200" x={4 * B} y={6.5 * B} fill="#feac4e" />
          <Text content={`${basicPointsStr} PTS ${basicCountStr}\u2190`} x={2 * B} y={8 * B} fill="white" />
          <Text content={`${fastPointsStr} PTS ${fastCountStr}\u2190`} x={2 * B} y={9.5 * B} fill="white" />
          <Text content={`${powerPointsStr} PTS ${powerCountStr}\u2190`} x={2 * B} y={11 * B} fill="white" />
          <Text content={`${armorPointsStr} PTS ${armorCountStr}\u2190`} x={2 * B} y={12.5 * B} fill="white" />

          {/* todo player-2的击杀统计 */}

          {/* total信息 */}
          <Text content={`TOTAL ${player1Total}`} x={3.5 * B} y={13.5 * B} fill="white" />
        </g>
      </g>
    )
  }
}

function mapStateToProps({ game: { transientKillInfo, currentStage, showTotalKillCount } }: State) {
  return {
    transientKillInfo,
    stageName: currentStage,
    showTotalKillCount,
  }
}

export default connect(mapStateToProps)(StatisticsOverlay)
