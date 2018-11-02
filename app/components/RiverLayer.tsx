import { List } from 'immutable'
import React from 'react'
import useTick from '../hooks/useTick'
import { getRowCol } from '../utils/common'
import { ITEM_SIZE_MAP, N_MAP } from '../utils/constants'
import River from './River'

interface RiverLayerProps {
  rivers: List<boolean>
}

export default function RiverLayer({ rivers }: RiverLayerProps) {
  const tickIndex = useTick(600, 600)

  return (
    <g className="river-layer">
      {rivers.map((set, t) => {
        if (set) {
          const [row, col] = getRowCol(t, N_MAP.RIVER)
          return (
            <River
              key={t}
              x={col * ITEM_SIZE_MAP.RIVER}
              y={row * ITEM_SIZE_MAP.RIVER}
              shape={tickIndex as 0 | 1}
            />
          )
        } else {
          return null
        }
      })}
    </g>
  )
}
