import * as React from 'react'
import * as _ from 'lodash'
import { Bitmap, Pixel } from 'components/elements'
import registerTick from 'hocs/registerTick'
import { BLOCK_SIZE, TANK_COLOR_SCHEMES } from 'utils/constants'
import { Direction } from 'types'

type P = {
  x: number,
  y: number,
  color: string,
  level: number,
  direction: Direction,
  tickIndex?: number,
  moving: boolean,
}

type S = { lastShape: number }

class TankClass extends React.Component<P, S> {
  static defaultProps = {
    moving: false,
  }

  constructor(props: P) {
    super(props)
    this.state = {
      lastShape: 0,
    }
  }

  componentWillReceiveProps(nextProps: P) {
    if (this.props.moving && !nextProps.moving) {
      this.setState({ lastShape: this.props.tickIndex })
    }
  }

  render() {
    const { x, y, color, level, direction, tickIndex, moving } = this.props
    const { lastShape } = this.state
    let rotate
    let dx
    let dy
    if (direction === 'up') {
      dx = x
      dy = y
      rotate = 0
    } else if (direction === 'down') {
      dx = x + BLOCK_SIZE - 1
      dy = y + BLOCK_SIZE
      rotate = 180
    } else if (direction === 'left') {
      dx = x
      dy = y + BLOCK_SIZE - 1
      rotate = -90
    } else { // RIGHT
      dx = x + BLOCK_SIZE
      dy = y
      rotate = 90
    }
    const shape = moving ? tickIndex : lastShape
    if (level === 0) {
      return (
        <TankLevel0
          transform={`translate(${dx}, ${dy})rotate(${rotate})`}
          color={color}
          shape={shape}
        />
      )
    } else {
      // todo complete level 1~7
      return (
        <TankLevel2
          transform={`translate(${dx}, ${dy})rotate(${rotate})`}
          color={color}
          shape={shape}
        />
      )
    }
  }
}

export const Tank: React.ComponentClass<P> = registerTick(80, 80)(TankClass)

type TankLevelX = (props: { transform: string, color: string, shape: number }) => JSX.Element

const TankLevel0: TankLevelX = ({ transform, color, shape }) => {
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

const TankLevel1: TankLevelX = ({ transform, color, shape }) => {
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

const TankLevel2: TankLevelX = ({ transform, color, shape }) => {
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

const TankLevel3: TankLevelX = ({ transform, color, shape }) => {
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

const TankLevel4: TankLevelX = ({ transform, color, shape }) => {
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

const TankLevel5: TankLevelX = ({ transform, color, shape }) => {
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

const TankLevel6: TankLevelX = ({ transform, color, shape }) => {
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

const TankLevel7: TankLevelX = ({ transform, color, shape }) => {
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
