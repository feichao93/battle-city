import React from 'react'
import { connect } from 'react-redux'
import { BLOCK_SIZE } from 'utils/constants'
import { Tank } from 'components/tanks'
import * as selectors from 'utils/selectors'

function mapStateToProps(state) {
  return selectors.player(state).toObject()
}

@connect(mapStateToProps)
export default class Screen extends React.Component {
  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    direction: React.PropTypes.string.isRequired,
    moving: React.PropTypes.bool.isRequired,
  }

  render() {
    const { direction, x, y, moving } = this.props
    return (
      <g role="screen">
        <g role="board" transform={`translate(${BLOCK_SIZE},${BLOCK_SIZE})`}>
          <rect width={13 * BLOCK_SIZE} height={13 * BLOCK_SIZE} fill="#000000" />
          <Tank
            direction={direction}
            x={x}
            y={y}
            level={0}
            color="yellow"
            moving={moving}
          />
        </g>
      </g>
    )
  }
}

