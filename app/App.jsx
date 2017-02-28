import React from 'react'
import { connect } from 'react-redux'
import { Tank } from 'components/tanks'
import { BLOCK_SIZE } from 'utils/constants'

function mapStateToProps(state) {
  return state.toObject()
}

@connect(mapStateToProps)
export default class App extends React.Component {
  static propTypes = {}

  render() {
    return (
      <svg className="svg" width="208" height="208">
        <g transform="scale(4)">
          <Tank
            direction="UP"
            x={0}
            y={0}
            level={0}
            color="yellow"
            moving
          />
          <Tank
            direction="DOWN"
            x={BLOCK_SIZE}
            y={0}
            level={0}
            color="green"
          />
          <Tank
            direction="LEFT"
            x={0}
            y={BLOCK_SIZE}
            level={0}
            color="silver"
          />
          <Tank
            direction="RIGHT"
            x={BLOCK_SIZE}
            y={BLOCK_SIZE}
            level={0}
            color="red"
            moving
          />
        </g>
      </svg>
    )
  }
}
