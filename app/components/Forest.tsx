import React from 'react'
import { Bitmap } from 'components/elements'

const scheme = {
  a: '#8CD600',
  b: '#005208',
  c: '#084A00',
  d: 'none',
}

const d = [
  'dbbbcbad',
  'bbcacaca',
  'bbbccaaa',
  'cbbaabca',
  'bbacaaac',
  'bcbaaaaa',
  'aaaaacaa',
  'daacaaad',
]

type P = {
  x: number
  y: number
}

export default class Forest extends React.PureComponent<P, {}> {
  render() {
    const { x, y } = this.props
    return (
      <g transform={`translate(${x},${y})`}>
        <Bitmap x={0} y={0} d={d} scheme={scheme} />
        <Bitmap x={8} y={0} d={d} scheme={scheme} />
        <Bitmap x={0} y={8} d={d} scheme={scheme} />
        <Bitmap x={8} y={8} d={d} scheme={scheme} />
      </g>
    )
  }
}
