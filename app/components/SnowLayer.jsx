import React from 'react'
import { getRowCol } from 'utils/common'
import { ITEM_SIZE_MAP, BLOCK_SIZE, FIELD_BSIZE } from 'utils/constants'
import Snow from 'components/Snow'

const N = BLOCK_SIZE / ITEM_SIZE_MAP.SNOW * FIELD_BSIZE

export default class SnowLayer extends React.PureComponent {
  static propTypes = {
    snows: React.PropTypes.any.isRequired,
  }

  render() {
    const { snows } = this.props

    return (
      <g role="snow-layer">
        {snows.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N)
            return (
              <Snow
                key={t}
                x={col * ITEM_SIZE_MAP.SNOW}
                y={row * ITEM_SIZE_MAP.SNOW}
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
