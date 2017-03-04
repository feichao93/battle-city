import React from 'react'
import { getRowCol } from 'utils/common'
import { ITEM_SIZE_MAP, BLOCK_SIZE, FIELD_BSIZE } from 'utils/constants'
import Forest from 'components/Forest'

const N = BLOCK_SIZE / ITEM_SIZE_MAP.FOREST * FIELD_BSIZE

export default class ForestLayer extends React.PureComponent {
  static propTypes = {
    forests: React.PropTypes.any.isRequired,
  }

  render() {
    const { forests } = this.props
    return (
      <g role="forest-layer">
        {forests.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N)
            return (
              <Forest
                key={t}
                x={col * ITEM_SIZE_MAP.FOREST}
                y={row * ITEM_SIZE_MAP.FOREST}
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
