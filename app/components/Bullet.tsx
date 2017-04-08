import * as React from 'react'
import { Pixel } from 'components/elements'
import { Direction } from 'types'

const fill = '#ADADAD'

type P = {
  x: number,
  y: number
  direction: Direction,
}

const Bullet = ({ x, y, direction }: P) => {
  let head = null
  if (direction === 'up') {
    head = <Pixel x={1} y={-1} fill={fill} />
  } else if (direction === 'down') {
    head = <Pixel x={1} y={3} fill={fill} />
  } else if (direction === 'left') {
    head = <Pixel x={-1} y={1} fill={fill} />
  } else if (direction === 'right') { // RIGHT
    head = <Pixel x={3} y={1} fill={fill} />
  } else {
    throw new Error(`Invalid direction ${direction}`)
  }
  return (
    <g role="bullet" transform={`translate(${x},${y})`}>
      {head}
      <rect width={3} height={3} fill={fill} />
    </g>
  )
}

export default Bullet
