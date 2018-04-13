import { Range } from 'immutable'
import React from 'react'
import {
  BLOCK_SIZE as B,
  FIELD_BLOCK_SIZE as FBZ,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from '../utils/constants'

export default class Grid extends React.PureComponent<{ t?: number }> {
  render() {
    const { t = -1 } = this.props
    const hrow = Math.floor(t / FBZ)
    const hcol = t % FBZ

    return (
      <g className="dash-lines" stroke="steelblue" strokeWidth="0.5" strokeDasharray="2 2">
        {Range(1, FBZ + 1)
          .map(col => (
            <line
              key={col}
              x1={B * col}
              y1={0}
              x2={B * col}
              y2={SCREEN_HEIGHT}
              strokeOpacity={hcol === col || hcol === col - 1 ? 1 : 0.3}
            />
          ))
          .toArray()}
        {Range(1, FBZ + 1)
          .map(row => (
            <line
              key={row}
              x1={0}
              y1={B * row}
              x2={SCREEN_WIDTH}
              y2={B * row}
              strokeOpacity={hrow === row || hrow === row - 1 ? 1 : 0.3}
            />
          ))
          .toArray()}
      </g>
    )
  }
}
