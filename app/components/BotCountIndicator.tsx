import range from 'lodash/range'
import React from 'react'
import Image from '../hocs/Image'

// <BotTankThumbnail />的尺寸为 8 * 8
const BotTankThumbnail = ({ x, y }: { x: number; y: number }) => (
  <Image imageKey="BotTankThumbnail" width="8" height="8" transform={`translate(${x},${y})`}>
    <g fill="#00000">
      <rect x={1} y={1} width={1} height={6} />
      <rect x={7} y={1} width={1} height={6} />
      <rect x={2} y={3} width={5} height={2} />
      <rect x={3} y={2} width={3} height={4} />
      <rect x={4} y={1} width={1} height={6} />
      <rect x={3} y={7} width={3} height={1} />
      <rect x={4} y={3} width={1} height={2} fill="#6B0800" />
    </g>
  </Image>
)

export interface BotCountIndicatorProps {
  count: number
  x?: number
  y?: number
}

export default class BotCountIndicator extends React.PureComponent<BotCountIndicatorProps> {
  render() {
    const { x = 0, y = 0, count } = this.props
    return (
      <g className="remaining-bot-count-indicator" transform={`translate(${x}, ${y})`}>
        {range(count).map(t => (
          <BotTankThumbnail key={t} x={8 * (t % 2)} y={8 * Math.floor(t / 2)} />
        ))}
      </g>
    )
  }
}
