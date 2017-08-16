import * as React from 'react'
import { ITEM_SIZE_MAP, BLOCK_SIZE as B } from 'utils/constants'
import BrickWall from 'components/BrickWall'
import Text from 'components/Text'

export default class GameoverScene extends React.PureComponent {
  render() {
    const size = ITEM_SIZE_MAP.BRICK
    const scale = 4
    return (
      <g role="gameover-scene">
        <defs>
          <pattern
            id="pattern-brickwall"
            width={size * 2 / scale}
            height={size * 2 / scale}
            patternUnits="userSpaceOnUse"
          >
            <g transform={`scale(${1 / scale})`}>
              <BrickWall x={0} y={0} />
              <BrickWall x={0} y={size} />
              <BrickWall x={size} y={0} />
              <BrickWall x={size} y={size} />
            </g>
          </pattern>
        </defs>
        <rect
          fill="#000000"
          x={0}
          y={0}
          width={16 * B}
          height={15 * B}
        />
        <g transform={`scale(${scale})`}>
          <Text
            content="game"
            x={4 * B / scale}
            y={4 * B / scale}
            fill="url(#pattern-brickwall)"
          />
          <Text
            content="over"
            x={4 * B / scale}
            y={7 * B / scale}
            fill="url(#pattern-brickwall)"
          />
        </g>
      </g>
    )
  }
}
