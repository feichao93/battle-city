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
}
export class Bitmap extends React.PureComponent<BitMapProps, {}>{
  static displayName = 'Bitmap'

  render() {
    const { x, y, d, scheme } = this.props
    const cols = d[0].length
    return (
      <g transform={`translate(${x},${y})`}>
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
