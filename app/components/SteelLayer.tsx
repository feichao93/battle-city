import React from 'react'
import { List } from 'immutable'
import { ITEM_SIZE_MAP, N_MAP } from 'utils/constants'
import { getRowCol } from 'utils/common'
import SteelWall from 'components/SteelWall'

type P = {
  steels: List<boolean>
}

export default class SteelLayer extends React.PureComponent<P, {}> {
  render() {
    const { steels } = this.props

    return (
      <g role="steel-layer">
        {steels.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N_MAP.STEEL)
            return <SteelWall key={t} x={col * ITEM_SIZE_MAP.STEEL} y={row * ITEM_SIZE_MAP.STEEL} />
          } else {
            return null
          }
        })}
      </g>
    )
  }
}
