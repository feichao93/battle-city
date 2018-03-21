import React from 'react'
import _ from 'lodash'
import { BLOCK_SIZE, FIELD_SIZE } from 'utils/constants'

// <EnemyTankThumbnail />的尺寸为 8 * 8
const EnemyTankThumbnail = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`} fill="#00000">
    <rect x={1} y={1} width={1} height={6} />
    <rect x={7} y={1} width={1} height={6} />
    <rect x={2} y={3} width={5} height={2} />
    <rect x={3} y={2} width={3} height={4} />
    <rect x={4} y={1} width={1} height={6} />
    <rect x={3} y={7} width={3} height={1} />
    <rect x={4} y={3} width={1} height={2} fill="#6B0800" />
  </g>
)

const transform = `translate(${1.5 * BLOCK_SIZE + FIELD_SIZE}, ${1.5 * BLOCK_SIZE})`

type P = { count: number }
export default class EnemyCountIndicator extends React.PureComponent<P, {}> {
  render() {
    const { count } = this.props
    return (
      <g role="remaining-enemy-count-indicator" transform={transform}>
        {_.range(count).map(t => (
          <EnemyTankThumbnail key={t} x={8 * (t % 2)} y={8 * Math.floor(t / 2)} />
        ))}
      </g>
    )
  }
}
