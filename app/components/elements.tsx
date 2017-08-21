import * as React from 'react'

type PixelProps = {
  x: number,
  y: number,
  fill: string,
}
export class Pixel extends React.PureComponent<PixelProps, {}> {
  static displayName = 'Pixel'
  render() {
    const { x, y, fill } = this.props
    return (
      <rect x={x} y={y} width={1} height={1} fill={fill} />
    )
  }
}

type BitMapProps = {
  x: number,
  y: number,
  d: string[],
  scheme: { [key: string]: string },
  style?: React.CSSProperties
}
export class Bitmap extends React.PureComponent<BitMapProps>{
  render() {
    const { x, y, d, scheme, style = {} } = this.props
    const cols = d[0].length
    return (
      <g transform={`translate(${x},${y})`} style={style}>
        {d.map((cs, dy) => Array.from(cs).map((c, dx) =>
          <Pixel
            key={dy * cols + dx}
            x={dx}
            y={dy}
            fill={scheme[c]}
          />
        ))}
      </g>
    )
  }
}
