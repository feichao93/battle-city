import React from 'react'
import { UP, DOWN, LEFT, RIGHT } from 'utils/constants'
import { Pixel } from 'components/elements'

const fill = '#ADADAD'

const Bullet = ({ x, y, direction }) => {
  let head = null
  if (direction === UP) {
    head = <Pixel x={1} y={-1} fill={fill} />
  } else if (direction === DOWN) {
    head = <Pixel x={1} y={3} fill={fill} />
  } else if (direction === LEFT) {
    head = <Pixel x={-1} y={1} fill={fill} />
  } else if (direction === RIGHT) { // RIGHT
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
Bullet.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  direction: React.PropTypes.string.isRequired,
}

export default Bullet
