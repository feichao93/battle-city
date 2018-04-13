import React from 'react'
import Image from '../hocs/Image'
import registerTick from '../hocs/registerTick'
import { frame as f } from '../utils/common'

interface TankHelmetProps {
  x: number
  y: number
  tickIndex: number
}

class TankHelmet extends React.PureComponent<TankHelmetProps> {
  render() {
    const { x, y, tickIndex } = this.props

    const ds = [
      'M0,8 v-2 h1 v-1 h1 v-1 h2 v-2 h1 v-1 h1 v-1 h2 v1 h-2 v1 h-1 v2 h-1 v1 h-2 v1 h-1 v2 h-1',
      'M0,2 h1 v-1 h1 v-1 h2 v1 h1 v1 h2 v1 h1 v1 h-1 v-1 h-2 v-1 h-1 v-1 h-2 v1 h-1 v2 h1 v1 h1 v2 h1 v1 h-1 v-1 h-1 v-2 h-1 v-1 h-1 v-2',
    ]

    return (
      <Image
        imageKey={`TankHelmet/${tickIndex}`}
        className="tank-helmet"
        transform={`translate(${x}, ${y})`}
        width="16"
        height="16"
      >
        <g fill="white">
          <path d={ds[tickIndex]} />
          <path transform="translate(16,0)rotate(90)" d={ds[tickIndex]} />
          <path transform="translate(16, 16)rotate(180)" d={ds[tickIndex]} />
          <path transform="translate(0, 16)rotate(270)" d={ds[tickIndex]} />
        </g>
      </Image>
    )
  }
}

export default registerTick(f(2), f(2))(TankHelmet)
