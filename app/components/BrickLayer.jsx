import React from 'react'
import { ITEM_SIZE_MAP, N_MAP } from 'utils/constants'
import { getRowCol } from 'utils/common'
import BrickWall from 'components/BrickWall'

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
            const [row, col] = getRowCol(t, N_MAP.BRICK)
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
