import { List } from 'immutable'
import React from 'react'
import { getRowCol } from '../utils/common'
import { ITEM_SIZE_MAP, N_MAP } from '../utils/constants'
import BrickWall from './BrickWall'

type P = {
  bricks: List<boolean>
}

export default class BrickLayer extends React.PureComponent<P, {}> {
  render() {
    const { bricks } = this.props

    return (
      <g className="brick-layer">
        {bricks.map((set, t) => {
          if (set) {
            const [row, col] = getRowCol(t, N_MAP.BRICK)
            return <BrickWall key={t} x={col * ITEM_SIZE_MAP.BRICK} y={row * ITEM_SIZE_MAP.BRICK} />
          } else {
            return null
          }
        })}
      </g>
    )
  }
}
