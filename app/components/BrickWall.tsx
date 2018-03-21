import React from 'react'
import { ITEM_SIZE_MAP } from 'utils/constants'

type P = {
  x: number
  y: number
}
export default class BrickWall extends React.PureComponent<P, {}> {
  render() {
    const { x, y } = this.props
    const brickWallPart = (transform: string, shape: boolean) => (
      <g role="brickwall" transform={transform}>
        <rect width={4} height={4} fill="#636363" />
        <rect x={shape ? 0 : 1} y={0} width={shape ? 4 : 3} height={3} fill="#6B0800" />
        <rect x={shape ? 0 : 2} y={1} width={shape ? 4 : 2} height={2} fill="#9C4A00" />
      </g>
    )
    const row = Math.floor(y / ITEM_SIZE_MAP.BRICK)
    const col = Math.floor(x / ITEM_SIZE_MAP.BRICK)

    if ((row + col) % 2 === 0) {
      return brickWallPart(`translate(${x},${y})`, true)
    } else {
      return brickWallPart(`translate(${x},${y})`, false)
    }
  }
}
