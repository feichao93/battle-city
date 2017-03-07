import React from 'react'
import registerTick from 'hocs/registerTick'
import delayedDispatch from 'hocs/delayedDispatch'
import { TANK_SPAWN_DELAY } from 'utils/constants'

const interval = TANK_SPAWN_DELAY / 12

@delayedDispatch(TANK_SPAWN_DELAY)
@registerTick(interval, interval, interval, interval)
export default class Flicker extends React.PureComponent {
  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    tickIndex: React.PropTypes.number.isRequired,
  }

  render() {
    const { x, y, tickIndex } = this.props
    const transform = `translate(${x},${y})`
    if (tickIndex === 0) {
      return (
        <g transform={transform} fill="#ffffff">
          <rect x={3} y={7} width={9} height={1} />
          <rect x={6} y={6} width={3} height={3} />
          <rect x={7} y={3} width={1} height={9} />
        </g>
      )
    } else if (tickIndex === 1) {
      return (
        <g transform={transform} fill="#ffffff">
          <rect x={2} y={7} width={11} height={1} />
          <rect x={5} y={6} width={5} height={3} />
          <rect x={6} y={5} width={3} height={5} />
          <rect x={7} y={2} width={1} height={11} />
        </g>
      )
    } else if (tickIndex === 2) {
      return (
        <g transform={transform} fill="#ffffff">
          <rect x={1} y={7} width={13} height={1} />
          <rect x={4} y={6} width={7} height={3} />
          <rect x={6} y={4} width={3} height={7} />
          <rect x={7} y={1} width={1} height={13} />
        </g>
      )
    } else if (tickIndex === 3) {
      return (
        <g transform={transform} fill="#ffffff">
          <rect x={0} y={7} width={15} height={1} />
          <rect x={3} y={6} width={9} height={3} />
          <rect x={5} y={5} width={5} height={5} />
          <rect x={6} y={3} width={3} height={9} />
          <rect x={7} y={0} width={1} height={15} />
        </g>
      )
    } else {
      throw new Error(`Invalid tickIndex: ${tickIndex}`)
    }
  }
}
