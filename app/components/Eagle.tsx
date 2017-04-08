import * as React from 'react'
import { Pixel } from 'components/elements'

const points = [
  [8, 3], [3, 6], [4, 7], [6, 8],
  [9, 8], [11, 7], [12, 6],
]

type P = {
  x: number,
  y: number,
  broken: boolean,
}

export default class Eagle extends React.PureComponent<P, {}> {
  static defaultProps = {
    broken: false,
  }

  render() {
    const { x, y, broken } = this.props

    if (broken) {
      return (
        <g role="eagle" transform={`translate(${x},${y})`}>
          <path
            fill="#9C4A00"
            d="M1,8 h1 v-2 h1 v-1 h1 v-2 h1 v-1 h1 v2 h-1 v1 h-1 v2 h-1 v2 h-1 v7 h-1 v-8"
          />
          <path
            fill="#636363"
            d="M7,3 h1 v1 h1 v1 h1 v1 h3 v1 h1 v2 h1 v2 h-1 v2 h-1 v-4 h-1 v2 h-1 v-1 h-2 v1 h-1 v2 h-1 v-1 h-2 v-1 h-2 v-1 h1 v-3 h1 v-2 h1 v-1 h1 v-1"
          />
        </g>
      )
    } else {
      return (
        <g role="eagle" transform={`translate(${x},${y})`}>
          <path
            fill="#636363"
            d="M0,1 h2 v1 h1 v1 h1 v2 h2 v1 h1 v-3 h-1 v-1 h3 v1 h1 v1 h-1 v2 h1 v-1 h2 v-2 h1 v-1 h1 v-1 h2 v1 h-1 v1 h1 v1 h-1 v1 h1 v1 h-2 v1 h1 v1 h-1 v2 h-1 v1 h-3 v-1 h-1 v2 h1 v1 h2 v2 h-2 v-1 h-1 v1 h-2 v-1 h-1 v1 h-2 v-2 h2 v-1 h1 v-2 h-1 v1 h-3 v-1 h-1 v-2 h-1 v-1 h1 v-1 h-2 v-1 h1 v-1 h-1 v-1 h1 v-1 h-1 v-1"
          />
          {points.map(([dx, dy], index) =>
            <Pixel key={index} x={dx} y={dy} fill="#6b0800" />
          )}
        </g>
      )
    }
  }
}
