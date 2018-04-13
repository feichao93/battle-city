import React from 'react'
import Image from '../hocs/Image'
import { ITEM_SIZE_MAP } from '../utils/constants'

export default class BrickWall extends React.PureComponent<Point> {
  render() {
    const { x, y } = this.props
    const row = Math.floor(y / ITEM_SIZE_MAP.BRICK)
    const col = Math.floor(x / ITEM_SIZE_MAP.BRICK)
    const shape = (row + col) % 2 === 0

    return (
      <Image
        className="brickwall"
        imageKey={`BrickWall/${shape}`}
        transform={`translate(${x}, ${y})`}
        width="4"
        height="4"
      >
        <rect width={4} height={4} fill="#636363" />
        <rect x={shape ? 0 : 1} y={0} width={shape ? 4 : 3} height={3} fill="#6B0800" />
        <rect x={shape ? 0 : 2} y={1} width={shape ? 4 : 2} height={2} fill="#9C4A00" />
      </Image>
    )
  }
}
