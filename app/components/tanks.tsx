import * as React from 'react'
import * as _ from 'lodash'
import { connect } from 'react-redux'
import { Bitmap, Pixel } from 'components/elements'
import { BLOCK_SIZE, TANK_COLOR_SCHEMES } from 'utils/constants'
import { frame as f } from 'utils/common'
import { TankRecord } from 'types'
import { State } from 'reducers'

interface TankComponent {
  (props: { transform: string, color: string, shape: number }): JSX.Element
}

function resolveTankColorConfig(tank: TankRecord): Timing<TankColor> {
  if (tank.color !== 'auto') {
    return [[tank.color, Infinity]]
  }
  if (tank.withPowerUp) {
    return [['red', f(8)], ['silver', f(8)]]
  }
  if (tank.level === 'basic') {
    return [['silver', Infinity]]
  } else if (tank.level === 'fast') {
    return [['silver', Infinity]]
  } else if (tank.level === 'power') {
    return [['silver', Infinity]]
  } else {
    const map: { [key: number]: Timing<TankColor> } = {
      1: [['silver', Infinity]],
      2: [['green', f(3)], ['yellow', f(1)], ['green', f(1)], ['yellow', f(1)]],
      3: [['silver', f(3)], ['yellow', f(1)], ['silver', f(1)], ['yellow', f(1)]],
      4: [['silver', f(3)], ['green', f(1)], ['silver', f(1)], ['green', f(1)]],
    }
    return map[tank.hp]
  }
}

function resolveTankComponent(side: Side, level: TankLevel): TankComponent {
  let component: TankComponent
  if (side === 'human') {
    if (level === 'basic') {
      component = TankHumanBasic
    } else if (level === 'fast') {
      component = TankHumanFast
    } else if (level === 'power') {
      component = TankHumanPower
    } else {
      component = TankHumanArmor
    }
  } else {
    if (level === 'basic') {
      component = TankAIBasic
    } else if (level === 'fast') {
      component = TankAIFast
    } else if (level === 'power') {
      component = TankAIPower
    } else {
      component = TankAIArmor
    }
  }
  return component
}


const tireShapeConfig: [number, number][] = [[0, 80], [1, 80]]

const add = (x: number, y: number) => x + y

function calculate<T>(config: Timing<T>, startTime: number, time: number): T {
  const sum = config.map(item => item[1]).reduce(add)
  let t = (time - startTime) % sum
  let index = 0
  while (config[index][1] < t) {
    t -= config[index][1]
    index += 1
  }
  return config[index][0]
}


function calculateTankTransform(tank: TankRecord) {
  let rotate
  let dx
  let dy
  if (tank.direction === 'up') {
    dx = tank.x
    dy = tank.y
    rotate = 0
  } else if (tank.direction === 'down') {
    dx = tank.x + BLOCK_SIZE - 1
    dy = tank.y + BLOCK_SIZE
    rotate = 180
  } else if (tank.direction === 'left') {
    dx = tank.x
    dy = tank.y + BLOCK_SIZE - 1
    rotate = -90
  } else { // RIGHT
    dx = tank.x + BLOCK_SIZE
    dy = tank.y
    rotate = 90
  }

  return `translate(${dx}, ${dy})rotate(${rotate})`
}

type P = {
  tank: TankRecord
  time: number
}

type S = { lastTireShape: number }

class TankClassBase extends React.Component<P, S> {
  private startTime: number

  constructor(props: P) {
    super(props)
    this.startTime = props.time
    this.state = {
      lastTireShape: 0,
    }
  }

  componentWillReceiveProps(nextProps: P) {
    if (this.props.tank.moving && !nextProps.tank.moving) {
      this.setState({
        lastTireShape: calculate(tireShapeConfig, this.startTime, nextProps.time),
      })
    }
  }

  render() {
    const { tank, time } = this.props
    const { lastTireShape } = this.state

    return React.createElement(resolveTankComponent(tank.side, tank.level), {
      transform: calculateTankTransform(tank),
      color: calculate(resolveTankColorConfig(tank), this.startTime, time),
      shape: tank.moving ? calculate(tireShapeConfig, this.startTime, time) : lastTireShape,
    })
  }
}

const mapStateToProps = ({ time }: State, { tank }: { tank: TankRecord }) => ({ time, tank })

export const Tank = connect(mapStateToProps)(TankClassBase)

const TankHumanBasic: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={5} width={3} height={9} fill={a} />
        <rect x={2} y={5} width={1} height={9} fill={b} />
        {shape === 0 ? (
          <g role="left-tire-shape-0">
            <Bitmap x={1} y={4} d={['abb']} scheme={scheme} />
            <Bitmap x={1} y={14} d={['abb']} scheme={scheme} />
            {_.range(5).map(i =>
              <rect key={i} x={1} width={2} y={5 + 2 * i} height={1} fill={c} />
            )}
          </g>
        ) : (
            <g role="left-tire-shape-1">
              <Bitmap x={1} y={4} d={['acc']} scheme={scheme} />
              <Bitmap x={1} y={14} d={['bcc']} scheme={scheme} />
              {_.range(4).map(i =>
                <rect key={i} x={1} width={2} y={6 + 2 * i} height={1} fill={c} />
              )}
            </g>
          )}
      </g>


      <g role="right-tire">
        <rect x={11} y={4} width={3} height={11} fill={c} />
        <Pixel x={11} y={4} fill={a} />

        {shape === 0 ? (
          <g role="right-tire-shape-0">
            {_.range(6).map(i =>
              <rect key={i} x={12} width={2} y={4 + 2 * i} height={1} fill={b} />
            )}
          </g>
        ) : (
            <g role="right-tire-shape-1">
              {_.range(5).map(i =>
                <rect key={i} x={12} width={2} y={5 + 2 * i} height={1} fill={b} />
              )}
            </g>
          )}
      </g>

      <g role="tank-body">
        <path d="M4,7 h1 v-1 h1 v2 h-1 v3 h1 v1 h1 v1 h-2 v-1 h-1 v-5" fill={a} />
        <Pixel x={4} y={12} fill={c} />
        <path d="M6,6 h1 v1 h3 v1 h1 v4 h-1 v1 h-3 v-1 h-1 v-1 h-1 v-3 h1 v-2" fill={b} />
        <Pixel x={10} y={12} fill={c} />
        <rect x={5} y={13} width={5} height={1} fill={c} />
        <rect x={8} width={2} y={6} height={1} fill={c} />
        <Pixel x={10} y={7} fill={c} />
        <path d="M6,8 h2 v1 h-1 v2 h-1 v-3" fill={a} />
        <path d="M8,9 h1 v3 h-2 v-1 h1 v-2" fill={c} />
      </g>
      <rect role="gun" x={7} y={2} width={1} height={5} fill={a} />
    </g>
  )
}

const TankHumanFast: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={5} width={3} height={11} fill={a} />
        <rect x={2} y={5} width={2} height={11} fill={b} />
        <Pixel x={3} y={5} fill={a} />
        <Pixel x={3} y={14} fill={a} />
        {shape === 0 ? (
          <g role="left-tire-shape-0">
            <Bitmap x={1} y={4} d={['abb']} scheme={scheme} />
            <Bitmap x={1} y={15} d={['ccc']} scheme={scheme} />
            {_.range(5).map(i =>
              <rect key={i} x={1} width={2} y={5 + 2 * i} height={1} fill={c} />
            )}
          </g>
        ) : (
            <g role="left-tire-shape-1">
              <Bitmap x={1} y={4} d={['bcc']} scheme={scheme} />
              <Bitmap x={1} y={15} d={['abb']} scheme={scheme} />
              {_.range(5).map(i =>
                <rect key={i} x={1} width={2} y={6 + 2 * i} height={1} fill={c} />
              )}
            </g>
          )}
      </g>


      <g role="right-tire">
        <rect x={11} y={4} width={3} height={12} fill={c} />
        <Pixel x={11} y={4} fill={a} />
        {shape === 0 ? (
          <g role="right-tire-shape-0">
            {_.range(6).map(i =>
              <rect key={i} x={12} width={2} y={4 + 2 * i} height={1} fill={b} />
            )}
          </g>
        ) : (
            <g role="right-tire-shape-1">
              {_.range(6).map(i =>
                <rect key={i} x={12} width={2} y={5 + 2 * i} height={1} fill={b} />
              )}
              <Pixel x={11} y={15} fill={b} />
            </g>
          )}
      </g>

      <g role="tank-body">
        <path d="M4,5 h2 v3 h-1 v5 h1 v1 h-2 v-9" fill={a} />
        <rect x={6} y={4} width={1} height={2} fill={c} />
        <path d="M8,4 h1 v1 h2 v10 h-7 v-1 h5 v-1 h1 v-5 h-1 v-2 h-1 v-2" fill={c} />
        <path d="M6,6 h1 v1 h1 v-1 h1 v2 h1 v5 h-1 v1 h-3 v-1 h-1 v-5 h1 v-2" fill={b} />
        <path d="M6,8 h2 v1 h-1 v3 h-1 v-4" fill={a} />
        <path d="M8,9 h1 v4 h-2 v-1 h1 v-3" fill={c} />
      </g>
      <rect role="gun" x={7} y={0} width={1} height={7} fill={a} />
    </g>
  )
}

const TankHumanPower: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={3} width={1} height={12} fill={a} />
        <rect x={2} y={3} width={2} height={12} fill={b} />
        {shape === 0 ? (
          <g role="left-tire-shape-0">
            <Bitmap x={1} y={3} d={['bcc']} scheme={scheme} />
            {_.range(5).map(i =>
              <rect key={i} x={1} width={1} y={5 + 2 * i} height={1} fill={c} />
            )}
          </g>
        ) : (
            <g role="left-tire-shape-1">
              <Bitmap x={1} y={3} d={['aaa']} scheme={scheme} />
              {_.range(5).map(i =>
                <rect key={i} x={1} width={1} y={4 + 2 * i} height={1} fill={c} />
              )}
            </g>
          )}
      </g>


      <g role="right-tire">
        <rect x={11} y={3} width={3} height={12} fill={c} />
        {shape === 0 ? (
          <g role="right-tire-shape-0">
            <Bitmap x={11} y={3} d={['a']} scheme={scheme} />
            {_.range(6).map(i =>
              <rect key={i} x={13} width={1} y={4 + 2 * i} height={1} fill={b} />
            )}
          </g>
        ) : (
            <g role="right-tire-shape-1">
              <Bitmap x={11} y={3} d={['ab']} scheme={scheme} />
              {_.range(6).map(i =>
                <rect key={i} x={13} width={1} y={3 + 2 * i} height={1} fill={b} />
              )}
            </g>
          )}
      </g>

      <g role="tank-body">
        <path d="M3,5 h2 v1 h-1 v5 h1 v1 h1 v1 h-2 v-1 h-1 v-7" fill={a} />
        <Pixel x={4} y={4} fill={c} />
        <rect x={5} y={3} width={1} height={2} fill={a} />
        <rect x={6} y={3} width={1} height={2} fill={c} />
        <path d="M8,3 h2 v1 h1 v2 h-1 v-1 h-2 v-2" fill={c} />
        <path d="M10,11 h1 v3 h-7 v-1 h5 v-1 h1 v-1 h1" fill={c} />
        <path d="M5,5 h5 v1 h1 v5 h-1 v1 h-1 v1 h-3 v-1 h-1 v-1 h-1 v-5 h1 v-1" fill={b} />
        <path d="M6,6 h2 v1 h-1 v4 h-1 v-5" fill={a} />
        <path d="M8,7 h1 v5 h-2 v-1 h1 v-4" fill={c} />
      </g>
      <g role="gun">
        <path d="M6,0 h3 v2 h-1 v3 h-1 v-3 h-1 v-2" fill={a} />
        <path d="M8,0 h1 v2 h-2 v-1 h1 v-1" fill={b} />
      </g>
    </g>
  )
}

const TankHumanArmor: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank3" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={1} width={1} height={14} fill={a} />
        <rect x={2} y={1} width={2} height={14} fill={b} />
        {shape === 0 ?
          <g role="left-tire-shape0">
            {_.range(7).map(i =>
              <rect key={i} x={1} y={2 * i + 2} width={1} height={1} fill={c} />)
            }
            <rect x={2} y={14} width={2} height={1} fill={c} />
          </g>
          :
          <g role="left-tire-shape1">
            <Bitmap x={1} y={1} d={['bcc']} scheme={scheme} />
            {_.range(6).map(i =>
              <rect key={i} x={1} y={2 * i + 3} width={1} height={1} fill={c} />)
            }
          </g>
        }
      </g>
      <g role="right-tire">
        <rect x={12} y={1} width={3} height={14} fill={b} />
        <Pixel x={12} y={1} fill={a} />
        {shape === 0 ?
          <g role="right-tire-shape0">
            {_.range(6).map(i =>
              <rect key={i} x={14} y={2 * i + 2} width={1} height={1} fill={c} />)
            }
            <rect x={13} y={14} width={2} height={1} fill={c} />
          </g>
          :
          <g role="right-tire-shape1">
            {_.range(7).map(i =>
              <rect key={i} x={14} y={2 * i + 1} width={1} height={1} fill={c} />)
            }
            <Pixel x={13} y={1} fill={c} />
          </g>
        }
      </g>
      <g role="tank-body">
        <path d="M4,2 h3 v-2 h2 v2 h3 v3 h-1 v7 h-7 v-10" fill={b} />
        <path d="M3,2 h3 v3 h1 v-5 h1 v6 h-3 v6 h-1 v-9 h-1 v-1" fill={a} />
        <rect x={9} y={2} width={1} height={3} fill={c} />
        <path d="M6,7 h3 v1 h-2 v2 h-1 v-3" fill={a} />
        <path d="M9,8 h1 v3 h-3 v-1 h2 v-2" fill={c} />
        <path d="M12,3 h1 v10 h-1 v-1 h-1 v-7 h1 v-2" fill={c} />
        <path d="M4,12 h7 v1 h1 v1 h-9 v-1 h1 v-1" fill={c} />
        <Pixel x={11} y={12} fill={b} />
        <Pixel x={12} y={13} fill={b} />
        <Pixel x={13} y={2} fill={c} />
        <Pixel x={12} y={14} fill={c} />
        <Pixel x={13} y={13} fill={c} />
      </g>
    </g>
  )
}

const TankAIBasic: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank4" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={3} width={1} height={11} fill={a} />
        <rect x={2} y={3} width={2} height={11} fill={b} />
        {shape === 0 ?
          <g role="left-tire-shape0">
            {_.range(5).map(i =>
              <rect key={i} x={1} y={2 * i + 4} width={2} height={1} fill={c} />)
            }
          </g>
          :
          <g role="left-tire-shape1">
            <Bitmap x={1} y={3} d={['bcc']} scheme={scheme} />
            {_.range(5).map(i =>
              <rect key={i} x={1} y={2 * i + 5} width={2} height={1} fill={c} />)
            }
          </g>
        }
      </g>
      <g role="right-tire">
        <rect x={11} y={3} width={3} height={11} fill={b} />
        <Pixel x={11} y={3} fill={a} />
        {shape === 0 ?
          <g role="right-tire-shape0">
            {_.range(5).map(i =>
              <rect key={i} x={12} y={2 * i + 4} width={2} height={1} fill={c} />)
            }
            <Pixel x={7} y={14} fill={b} />
          </g>
          :
          <g role="right-tire-shape1">
            {_.range(6).map(i =>
              <rect key={i} x={12} y={2 * i + 3} width={2} height={1} fill={c} />)
            }
            <Pixel x={7} y={14} fill={c} />
          </g>
        }
      </g>
      <g role="tank-body">
        <path d="M5,4 h1 v3 h-1 v4 h1 v2 h-1 v-1 h-1 v-7 h1 v-1" fill={a} />
        <path
          d="M8,3 h1 v1 h1 v1 h1 v7 h-1 v1 h-1 v1 h-3 v-1 h2 v-1 h1 v-1 h1 v-4 h-1 v-1 h-1 v-3"
          fill={c}
        />
        <path d="M6,3 h1 v3 h2 v1 h1 v4 h-1 v1 h-1 v1 h-2 v-2 h-1 v-4 h1 v-4" fill={b} />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
      <g role="tank-gun">
        <rect x={7} y={0} width={1} height={6} fill={a} />
      </g>
    </g>
  )
}

const TankAIFast: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank5" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={2} width={2} height={3} fill={c} />
        <rect x={1} y={7} width={2} height={3} fill={c} />
        <rect x={1} y={12} width={2} height={3} fill={c} />
        {shape === 0 ?
          <g role="left-tire-shape0">
            {_.range(3).map(i =>
              <rect key={i} x={1} y={5 * i + 2} width={1} height={1} fill={b} />)
            }
          </g>
          :
          <g role="left-tire-shape1">
            {_.range(3).map(i =>
              <rect key={i} x={1} y={5 * i + 3} width={1} height={1} fill={b} />)
            }
          </g>
        }
      </g>
      <g role="right-tire">
        <rect x={12} y={2} width={2} height={3} fill={c} />
        <rect x={12} y={7} width={2} height={3} fill={c} />
        <rect x={12} y={12} width={2} height={3} fill={c} />
        {shape === 0 ?
          <g role="right-tire-shape0">
            {_.range(3).map(i =>
              <rect key={i} x={12} y={5 * i + 2} width={1} height={1} fill={b} />)
            }
            <Pixel x={7} y={14} fill={a} />
          </g>
          :
          <g role="right-tire-shape1">
            {_.range(3).map(i =>
              <rect key={i} x={12} y={5 * i + 3} width={1} height={1} fill={b} />)
            }
            <Pixel x={7} y={14} fill={b} />
          </g>
        }
      </g>
      <g role="tank-body">
        <path d="M4,2 h2 v4 h-1 v5 h1 v1 h3 v1 h-5 v1 h-1 v-11 h1 v-1" fill={a} />
        <Pixel x={9} y={11} fill={a} />
        <path d="M3,4 h1 v1 h1 v1 h-1 v6 h2 v1 h-2 v1 h-1 v-10" fill={b} />
        <rect x={6} y={2} width={1} height={3} fill={c} />
        <path
          d="M8,2 h1 v2 h2 v11 h-3 v-1 h-1 v1 h-3 v-2 h5 v-1 h1 v-6 h-1 v-1 h-1 v-3" fill={c}
        />
        <rect x={9} y={2} height={2} width={2} fill={b} />
        <rect x={11} y={3} height={11} width={1} fill={b} />
        <path d="M6,5 h1 v1 h1 v-1 h1 v1 h1 v5 h-1 v1 h-3 v-1 h-1 v-5 h1 v-1" fill={b} />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
      <g role="tank-gun">
        <rect x={7} y={0} width={1} height={6} fill={a} />
      </g>
    </g>
  )
}

const TankAIPower: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank6" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={3} width={1} height={12} fill={a} />
        <rect x={2} y={3} width={2} height={12} fill={b} />
        {shape === 0 ?
          <g role="left-tire-shape0">
            {_.range(6).map(i =>
              <rect key={i} x={1} y={2 * i + 4} width={2} height={1} fill={c} />)
            }
          </g>
          :
          <g role="left-tire-shape1">
            <Bitmap x={1} y={3} d={['bcc']} scheme={scheme} />
            {_.range(5).map(i =>
              <rect key={i} x={1} y={2 * i + 5} width={2} height={1} fill={c} />)
            }
          </g>
        }
      </g>
      <g role="right-tire">
        <rect x={11} y={3} width={3} height={12} fill={b} />
        <Pixel x={11} y={3} fill={a} />
        {shape === 0 ?
          <g role="right-tire-shape0">
            {_.range(6).map(i =>
              <rect key={i} x={12} y={2 * i + 4} width={2} height={1} fill={c} />)
            }
            <Pixel x={7} y={14} fill={a} />
          </g>
          :
          <g role="right-tire-shape1">
            {_.range(6).map(i =>
              <rect key={i} x={12} y={2 * i + 3} width={2} height={1} fill={c} />)
            }
            <Pixel x={7} y={14} fill={b} />
          </g>
        }
      </g>
      <g role="tank-body">
        <path d="M5,4 h1 v3 h-1 v4 h1 v1 h1 v2 h-2 v-2 h-1 v-7 h1 v-1" fill={a} />
        <Pixel x={6} y={14} fill={b} />
        <path d="M6,3 h1 v3 h2 v1 h1 v4 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-4 h1 v-4" fill={b} />
        <path
          d="M8,3 h1 v1 h1 v1 h1 v7 h-1 v2 h-1 v1 h-1 v-1 h-1 v-1 h1 v-1 h1 v-1 h1 v-4 h-1 v-1 h-1 v-3"
          fill={c}
        />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
      <g role="tank-gun">
        <path d="M6,0 h2 v6 h-1 v-5 h-1 v-1" fill={a} />
        <Pixel x={8} y={0} fill={b} />
      </g>
    </g>
  )
}

const TankAIArmor: TankComponent = ({ transform, color, shape }) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g role="tank7" transform={transform}>
      <g role="left-tire">
        <rect x={1} y={0} width={1} height={15} fill={a} />
        <rect x={2} y={0} width={2} height={15} fill={b} />
        {shape === 0 ?
          <g role="left-tire-shape0">
            {_.range(7).map(i =>
              <rect key={i} x={1} y={2 * i + 1} width={2} height={1} fill={c} />)
            }
          </g>
          :
          <g role="left-tire-shape1">
            <Bitmap x={1} y={0} d={['bc']} scheme={scheme} />
            {_.range(7).map(i =>
              <rect key={i} x={1} y={2 * i + 2} width={2} height={1} fill={c} />)
            }
          </g>
        }
      </g>
      <g role="right-tire">
        <rect x={11} y={0} width={3} height={15} fill={b} />
        <Pixel x={11} y={0} fill={a} />
        <Pixel x={11} y={14} fill={c} />
        {shape === 0 ?
          <g role="right-tire-shape0">
            {_.range(7).map(i =>
              <rect key={i} x={12} y={2 * i + 1} width={2} height={1} fill={c} />)
            }
            <Pixel x={7} y={14} fill={b} />
          </g>
          :
          <g role="right-tire-shape1">
            {_.range(8).map(i =>
              <rect key={i} x={12} y={2 * i} width={2} height={1} fill={c} />)
            }
            <Pixel x={7} y={14} fill={a} />
          </g>
        }
      </g>
      <g role="tank-body">
        <path d="M4,1 h2 v-1 h3 v1 h2 v4 h-1 v7 h-5 v1 h-1 v-12" fill={b} />
        <path d="M6,0 h2 v6 h1 v-2 h1 v3 h-5 v5 h-1 v-9 h1 v2 h1 v1 h1 v-4 h-1 v-2" fill={a} />
        <Pixel x={5} y={1} fill={c} />
        <Pixel x={9} y={1} fill={c} />
        <rect x={8} y={2} width={1} height={4} fill={c} />
        <path d="M11,3 h1 v10 h-1 v-1 h-1 v-7 h1 v-2" fill={c} />
        <path d="M4,13 h1 v-1 h5 v1 h1 v1 h-7 v-1" fill={c} />
        <Pixel x={10} y={12} fill={b} />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
    </g>
  )
}
