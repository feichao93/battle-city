import React from 'react'
import * as _ from 'lodash'
import { Pixel } from 'components/elements'

const colorSchemes = {
  yellow: {
    a: '#E7E794',
    b: '#E79C21',
    c: '#6B6B00',
  },
  green: {
    a: '#B5F7CE',
    b: '#008C31',
    c: '#005200',
  },
  silver: {
    a: '#FFFFFF',
    b: '#ADADAD',
    c: '#00424A',
  },
  red: {
    a: '#FFFFFF',
    b: '#B53121',
    c: '#5A007B',
  },
}

export const Tank = ({ x, y, color }) => {
  const { a, b, c } = colorSchemes[color]
  return (
    <g role="tank" transform={`translate(${x}, ${y}) scale(2)`}>
      <rect x={1} y={4} width={1} height={11} fill={a} />
      <rect x={2} y={4} width={1} height={11} fill={b} />
      <rect x={3} y={4} width={1} height={11} fill={a} />
      {_.range(5).map(i =>
        <rect key={i} x={1} width={2} y={5 + 2 * i} height={1} fill={c} />
      )}
      <Pixel x={3} y={4} fill={b} />
      <Pixel x={3} y={14} fill={b} />

      {/* right-tire */}
      <rect x={11} y={4} width={3} height={11} fill={c} />
      <Pixel x={11} y={4} fill={a} />
      {_.range(6).map(i =>
        <rect key={i} x={12} width={2} y={4 + 2 * i} height={1} fill={b} />
      )}

      {/* body */}
      <path d="M4,7 h1 v-1 h1 v2 h-1 v3 h1 v1 h1 v1 h-2 v-1 h-1 v-5" fill={a} />
      <Pixel x={4} y={12} fill={c} />
      <path d="M6,6 h1 v1 h3 v1 h1 v4 h-1 v1 h-3 v-1 h-1 v-1 h-1 v-3 h1 v-2" fill={b} />
      <Pixel x={10} y={12} fill={c} />
      <rect x={5} y={13} width={5} height={1} fill={c} />
      <rect x={8} width={2} y={6} height={1} fill={c} />
      <Pixel x={10} y={7} fill={c} />
      <path d="M6,8 h2 v1 h-1 v2 h-1 v-3" fill={a} />
      <path d="M8,9 h1 v3 h-2 v-1 h1 v-2" fill={c} />

      {/* gun */}
      <rect x={7} y={2} width={1} height={5} fill={a} />
    </g>
  )
}
Tank.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  color: React.PropTypes.string.isRequired,
}
