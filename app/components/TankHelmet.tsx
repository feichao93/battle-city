import * as React from 'react'
import registerTick from 'hocs/registerTick'

interface P {
  x: number
  y: number
  tickIndex: number
}

class TankHelmet extends React.PureComponent<P> {
  render() {
    const { x, y, tickIndex } = this.props

    const ds = [
      'M0,8 v-2 h1 v-1 h1 v-1 h2 v-2 h1 v-1 h1 v-1 h2 v1 h-2 v1 h-1 v2 h-1 v1 h-2 v1 h-1 v2 h-1',
      'M0,2 h1 v-1 h1 v-1 h2 v1 h1 v1 h2 v1 h1 v1 h-1 v-1 h-2 v-1 h-1 v-1 h-2 v1 h-1 v2 h1 v1 h1 v2 h1 v1 h-1 v-1 h-1 v-2 h-1 v-1 h-1 v-2',
    ]

    return (
      <g role="tank-helmet" transform={`translate(${x}, ${y})`} fill="white">
        <path
          d={ds[tickIndex]}
        />
        <path
          transform="rotate(90)"
          style={{ transformOrigin: 'right bottom' }}
          d={ds[tickIndex]}
        />
        <path
          transform="rotate(180)"
          style={{ transformOrigin: 'right bottom' }}
          d={ds[tickIndex]}
        />
        <path
          transform="rotate(270)"
          style={{ transformOrigin: 'right bottom' }}
          d={ds[tickIndex]}
        />
      </g>
    )
  }
}

export default registerTick(70, 70)(TankHelmet)
