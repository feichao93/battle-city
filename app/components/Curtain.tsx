import React from 'react'

interface P {
  name: string
  animationSchema?: 'default'
  t: number
  x?: number
  y?: number
  width: number
  height: number
}

export default class Curtain extends React.PureComponent<P> {
  render() {
    const { name, children, t, x = 0, y = 0, width, height } = this.props
    return (
      <g role={`curtain-${name}`} transform={`translate(${x}, ${y})`}>
        <defs>
          <clipPath id="default-curtain">
            <rect x={0} y={0} width={width} height={(height / 2) * t} />
            <rect x={0} y={height * (1 - t / 2)} width={width} height={(height / 2) * t} />
          </clipPath>
        </defs>
        <g clipPath="url(#default-curtain)">{children}</g>
      </g>
    )
  }
}
