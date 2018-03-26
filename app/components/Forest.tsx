import React from 'react'
import { Bitmap } from 'components/elements'
import ImageComponent from './ImageComponent'

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

export default class Forest extends ImageComponent<Point> {
  getConfig() {
    const { x, y } = this.props
    return {
      key: 'Forest',
      transform: `translate(${x},${y})`,
      width: 16,
      height: 16,
    }
  }

  renderImageContent() {
    return (
      <g>
        <Bitmap x={0} y={0} d={d} scheme={scheme} />
        <Bitmap x={8} y={0} d={d} scheme={scheme} />
        <Bitmap x={0} y={8} d={d} scheme={scheme} />
        <Bitmap x={8} y={8} d={d} scheme={scheme} />
      </g>
    )
  }
}
