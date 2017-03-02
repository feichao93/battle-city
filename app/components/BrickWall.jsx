import React from 'react'

export default class BrickWall extends React.Component {
  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
  }

  render() {
    const { x, y } = this.props
    const brickWallPart = (transform, type) => (
      <g role={`brickwall${type}`} transform={transform}>
        <rect width={4} height={4} fill="#636363" />
        <rect
          x={type === 1 ? 0 : 1}
          y={0}
          width={type === 1 ? 4 : 3}
          height={3}
          fill="#6B0800"
        />
        <rect
          x={type === 1 ? 0 : 2}
          y={1}
          width={type === 1 ? 4 : 2}
          height={2}
          fill="#9C4A00"
        />
      </g>
    )
    return (
      <g role="wall" transform={`translate(${x},${y})`}>
        {brickWallPart('translate(0,0)', 1)}
        {brickWallPart('translate(0,4)', 2)}
        {brickWallPart('translate(4,0)', 2)}
        {brickWallPart('translate(4,4)', 1)}
      </g>
    )
  }
}
