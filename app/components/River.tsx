import React from 'react'
import Image from '../hocs/Image'
import { Pixel } from './elements'

const coordinates = [
  [[5, 0], [0, 2], [1, 3], [4, 3], [3, 4], [5, 4], [1, 6], [2, 7], [6, 7]],
  [[7, 0], [1, 1], [2, 2], [3, 3], [6, 3], [7, 4], [3, 5], [2, 6], [4, 6], [0, 7]],
]

const riverPart = (shape: number, dx: number, dy: number) => (
  <g transform={`translate(${dx},${dy})`}>
    <rect width={8} height={8} fill="#4242FF" />
    {coordinates[shape].map(([x, y], i) => (
      <Pixel key={i} x={x} y={y} fill="#B5EFEF" />
    ))}
  </g>
)

type RiverProps = {
  x: number
  y: number
  shape: 0 | 1
}

export default class River extends React.PureComponent<RiverProps> {
  render() {
    const { x, y, shape } = this.props
    return (
      <Image imageKey={`River/${shape}`} transform={`translate(${x},${y})`} width="16" height="16">
        {riverPart(shape, 0, 0)}
        {riverPart(shape, 8, 0)}
        {riverPart(shape, 8, 8)}
        {riverPart(shape, 0, 8)}
      </Image>
    )
  }
}
