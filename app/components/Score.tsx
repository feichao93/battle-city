import React from 'react'

interface P {
  score: number
  x?: number
  y?: number
}

const Zero = ({ x, y }: Point) => (
  <g className="zero" transform={`translate(${x}, ${y})`}>
    <rect x="1" y="0" width="2" height="1" />
    <rect x="1" y="6" width="2" height="1" />
    <rect x="0" y="1" width="1" height="5" />
    <rect x="3" y="1" width="1" height="5" />
  </g>
)

const One = ({ x, y }: Point) => (
  <g className="one" transform={`translate(${x}, ${y})`}>
    <rect x="1" y="1" width="1" height="1" />
    <rect x="1" y="6" width="3" height="1" />
    <rect x="2" y="0" width="1" height="7" />
  </g>
)

const Two = ({ x, y }: Point) => (
  <g className="two" transform={`translate(${x}, ${y})`}>
    <rect x="0" y="1" width="1" height="1" />
    <rect x="1" y="0" width="2" height="1" />
    <rect x="3" y="1" width="1" height="2" />
    <rect x="2" y="3" width="1" height="1" />
    <rect x="1" y="4" width="1" height="1" />
    <rect x="0" y="5" width="1" height="1" />
    <rect x="0" y="6" width="4" height="1" />
  </g>
)

const Three = ({ x, y }: Point) => (
  <path
    className="three"
    d={`M${x},${y +
      1} h1 v-1 h2 v1 h1 v2 h-1 v1 h1 v2 h-1 v1 h-2 v-1 h-1 v-1 h1 v1 h2 v-2 h-2 v-1 h2 v-2 h-2 v1 h-1 v-1`}
  />
)

const Four = ({ x, y }: Point) => (
  <path
    className="four"
    d={`M${x + 1},${y + 2} v-1 h1 v-1 h1 v4 h-1 v-2 h-1 v2 h3 v1 h-1 v2 h-1 v-2 h-2 v-3 h1`}
  />
)

const Five = ({ x, y }: Point) => (
  <path
    className="five"
    d={`M${x},${y} h4 v1 h-3 v1 h2 v1 h1 v3 h-1 v1 h-2 v-1 h-1 v-1 h1 v1 h2 v-3 h-3 v-3`}
  />
)

export default class Score extends React.PureComponent<P> {
  render() {
    const { score, x = 0, y = 0 } = this.props
    let Num: typeof One
    if (score === 100) {
      Num = One
    } else if (score === 200) {
      Num = Two
    } else if (score === 300) {
      Num = Three
    } else if (score === 400) {
      Num = Four
    } else if (score === 500) {
      Num = Five
    } else {
      throw new Error(`Invalid score: ${score}`)
    }
    return (
      <g transform={`translate(${x},${y})`} fill="white">
        <Num x={1} y={4} />
        <Zero x={6} y={4} />
        <Zero x={11} y={4} />
      </g>
    )
  }
}
