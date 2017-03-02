import React from 'react'
import { BLOCK_SIZE, ITEM_SIZE_MAP, FIELD_BSIZE } from 'utils/constants'
import { getRowCol } from 'utils/common'
import BrickWall from 'components/BrickWall'

const N = BLOCK_SIZE / ITEM_SIZE_MAP.BRICK * FIELD_BSIZE

export default class BrickLayer extends React.PureComponent {
  static propTypes = {
    bricks: React.PropTypes.any.isRequired, // todo
  }

  render() {
    const { bricks } = this.props

    return (
      <g role="brick-layer">
        {bricks.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N)
            return (
              <BrickWall
                key={t}
                x={col * ITEM_SIZE_MAP.BRICK}
                y={row * ITEM_SIZE_MAP.BRICK}
              />
            )
          } else {
            return null
          }
        })}
      </g>
    )
  }
}
