import React from 'react'
import { BulletRecord } from '../types'
import { Pixel } from './elements'

const fill = '#ADADAD'

const Bullet = ({ bullet }: { bullet: BulletRecord }) => {
  const { direction, x, y } = bullet
  let head: JSX.Element = null
  if (direction === 'up') {
    head = <Pixel x={1} y={-1} fill={fill} />
  } else if (direction === 'down') {
    head = <Pixel x={1} y={3} fill={fill} />
  } else if (direction === 'left') {
    head = <Pixel x={-1} y={1} fill={fill} />
  } else {
    // right
    head = <Pixel x={3} y={1} fill={fill} />
  }
  return (
    <g className="bullet" transform={`translate(${x},${y})`}>
      <rect width={3} height={3} fill={fill} />
      {head}
    </g>
  )
}

export default Bullet
