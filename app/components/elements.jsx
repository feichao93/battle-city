import React from 'react'

export const Pixel = ({ x, y, fill }) => (
  <rect x={x} y={y} width={1} height={1} fill={fill} />
)

Pixel.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  fill: React.PropTypes.string.isRequired,
}
