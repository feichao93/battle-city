import React from 'react'
import { getRowCol } from 'utils/common'
import { N_MAP, ITEM_SIZE_MAP } from 'utils/constants'
import River from 'components/River'

export default class RiverLayer extends React.PureComponent {
  static propTypes = {
    rivers: React.PropTypes.any.isRequired,
  }

  render() {
    const { rivers } = this.props

    return (
      <g role="river-layer">
        {rivers.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N_MAP.RIVER)
            return (
              <River
                key={t}
                x={col * ITEM_SIZE_MAP.RIVER}
                y={row * ITEM_SIZE_MAP.RIVER}
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