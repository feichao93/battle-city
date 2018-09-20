import _ from 'lodash'
import React from 'react'
import Image from '../hocs/Image'
import { Pixel } from './elements'

const a = '#ffffff'
const b = '#adadad'
const c = '#636363'

const snowPart = (dx: number, dy: number) => (
  <g transform={`translate(${dx},${dy})`}>
    <rect width={8} height={8} fill={b} />
    <Pixel x={0} y={0} fill={c} />
    <Pixel x={3} y={0} fill={a} />
    <Pixel x={4} y={0} fill={c} />
    <Pixel x={0} y={3} fill={a} />
    <Pixel x={0} y={4} fill={c} />
    {_.range(8).map(t => (
      <Pixel key={t} x={t} y={7 - t} fill={a} />
    ))}
    {_.range(7).map(t => (
      <Pixel key={t} x={1 + t} y={7 - t} fill={c} />
    ))}
    {_.range(4).map(t => (
      <Pixel key={t} x={4 + t} y={7 - t} fill={a} />
    ))}
    {_.range(3).map(t => (
      <Pixel key={t} x={5 + t} y={7 - t} fill={c} />
    ))}
  </g>
)

export default class Snow extends React.PureComponent<Point> {
  render() {
    const { x, y } = this.props
    return (
      <Image imageKey="Snow" transform={`translate(${x}, ${y})`} width="16" height="16">
        {snowPart(0, 0)}
        {snowPart(8, 0)}
        {snowPart(8, 8)}
        {snowPart(0, 8)}
      </Image>
    )
  }
}
