import React from 'react'
import * as _ from 'lodash'
import { Pixel, Bitmap } from 'components/elements'
import { TANK_COLOR_SCHEMES, UP, DOWN, LEFT, RIGHT, BLOCK_SIZE } from 'utils/constants'

export class Tank extends React.Component {
  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    color: React.PropTypes.string.isRequired,
    level: React.PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 7]).isRequired,
    direction: React.PropTypes.oneOf([UP, DOWN, LEFT, RIGHT]).isRequired,
    moving: React.PropTypes.bool,
  }

  static defaultProps = {
    moving: false,
  }

  constructor(props) {
    super(props)
    this.handle = null
    this.state = {
      shape: 0,
    }
  }

  componentDidMount() {
    if (this.props.moving) {
      this.startMoving()
    }
  }

  componentWillUpdate(nextProps) {
    if (!this.props.moving && nextProps.moving) {
      this.startMoving()
    } else if (this.props.moving && !nextProps.moving) {
      this.stopMoving()
    }
  }

  componentWillUnmount() {
    this.stopMoving()
  }

  startMoving() {
    this.handle = setInterval(() => {
      this.setState({ shape: this.state.shape + 1 })
    }, 100)
  }

  stopMoving() {
    clearInterval(this.handle)
  }

  render() {
    const { x, y, color, level, direction } = this.props
    // todo 不能这么简单的计算dx, dy, rotate. 这样算和实际有点出入
    let rotate
    let dx
    let dy
    if (direction === UP) {
      dx = x
      dy = y
      rotate = 0
    } else if (direction === DOWN) {
      dx = x + BLOCK_SIZE
      dy = y + BLOCK_SIZE
      rotate = 180
    } else if (direction === LEFT) {
      dx = x
      dy = y + BLOCK_SIZE
      rotate = -90
    } else { // RIGHT
      dx = x + BLOCK_SIZE
      dy = y
      rotate = 90
    }
    if (level === 0) {
      return (
        <TankLevel0
          x={x}
          y={y}
          transform={`translate(${dx}, ${dy})rotate(${rotate})`}
          color={color}
          shape={this.state.shape % 2}
        />
      )
    } else {
      // todo complete level 1~7
      return null
    }
  }
}

const TankLevel0 = ({ transform, color, shape }) => {
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

TankLevel0.propTypes = {
  transform: React.PropTypes.string.isRequired,
  color: React.PropTypes.string.isRequired,
  shape: React.PropTypes.oneOf([0, 1]).isRequired,
}
