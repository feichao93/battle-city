import React from 'react'
import { STEEL_WALL_COLOR_SCHEMES } from 'utils/constants'

export class SteelWall extends React.Component {
  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
  }


  render() {
    const { x, y }=this.props
    return (
      <g role="steelwall" transform={`translate(${x},${y})`}>
        <rect width={8} height={8} fill={STEEL_WALL_COLOR_SCHEMES.c} />
        <rect x={2} y={2} width={4} height={4} fill={STEEL_WALL_COLOR_SCHEMES.a} />
        <path d="M6,2 h1,v-1,h1,v7,h-7,v-1,h1,v-1,h4,v-4" fill={STEEL_WALL_COLOR_SCHEMES.b} />
      </g>
    )
  }
}
