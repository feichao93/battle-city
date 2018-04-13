import React from 'react'
import Image from '../hocs/Image'
import { Bitmap } from './elements'

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

export default class Forest extends React.PureComponent<Point> {
  render() {
    const { x, y } = this.props
    return (
      <Image imageKey="Forest" transform={`translate(${x},${y})`} width="16" height="16">
        <Bitmap x={0} y={0} d={d} scheme={scheme} />
        <Bitmap x={8} y={0} d={d} scheme={scheme} />
        <Bitmap x={0} y={8} d={d} scheme={scheme} />
        <Bitmap x={8} y={8} d={d} scheme={scheme} />
      </Image>
    )
  }
}
