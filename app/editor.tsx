import 'normalize.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import createSagaMiddleware from 'redux-saga'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import { is, List, Range, Record, Repeat } from 'immutable'
import { Provider } from 'react-redux'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE as FBZ } from 'utils/constants'
import BrickLayer from 'components/BrickLayer'
import SteelLayer from 'components/SteelLayer'
import RiverLayer from 'components/RiverLayer'
import SnowLayer from 'components/SnowLayer'
import ForestLayer from 'components/ForestLayer'
import Eagle from 'components/Eagle'
import Text from 'components/Text'
import River from 'components/River'
import Snow from 'components/Snow'
import Forest from 'components/Forest'
import BrickWall from 'components/BrickWall'
import SteelWall from 'components/SteelWall'
import tickEmitter from 'sagas/tickEmitter'
import { time } from 'reducers/index'
import game from 'reducers/game'
import parseStageMap from 'utils/parseStageMap'

const simpleSagaMiddleware = createSagaMiddleware()
const simpleReducer = combineReducers({ time, game })

const simpleStore = createStore(simpleReducer, undefined, applyMiddleware(simpleSagaMiddleware))
simpleSagaMiddleware.run(tickEmitter)

function nextHex(hex: number) {
  if (hex === 0xf) {
    return 0x1
  } else {
    return hex + 1
  }
}
function prevHex(hex: number) {
  if (hex === 0x1) {
    return 0xf
  } else {
    return hex - 1
  }
}

function toString(list: List<MapItemRecord>): StageConfig['map'] {
  const result: string[] = []
  for (let row = 0; row < FBZ; row += 1) {
    const array: string[] = []
    for (let col = 0; col < FBZ; col += 1) {
      const { type, hex } = list.get(row * FBZ + col)
      if (type === 'B') {
        array.push('B' + hex.toString(16))
      } else if (type === 'E') {
        array.push('E')
      } else if (type === 'R') {
        array.push('R')
      } else if (type === 'S') {
        array.push('S')
      } else if (type === 'T') {
        array.push('T' + hex.toString(16))
      } else if (type === 'F') {
        array.push('F')
      } else { // type === 'X'
        array.push('X')
      }
    }
    result.push(array.join(' '))
  }
  return result
}

export type MapItemType = 'X' | 'E' | 'B' | 'T' | 'R' | 'S' | 'F'

export const MapItemRecord = Record({
  type: 'X' as MapItemType,
  hex: 0xF,
})

const mapItemRecord = MapItemRecord()

export type MapItemRecord = typeof mapItemRecord

const log = (...args: any[]) => () => console.log(...args)

const DashLines = () => (
  <g
    stroke="steelblue"
    strokeWidth="0.5"
    strokeDasharray="2 2"
  >
    {Range(1, FBZ).map(x =>
      <line
        key={x}
        x1={B * x}
        y1={0}
        x2={B * x}
        y2={15 * B}
      />
    ).toArray()}
    {Range(1, FBZ).map(y =>
      <line
        key={y}
        x1={0}
        y1={B * y}
        x2={16 * B}
        y2={B * y}
      />
    ).toArray()}
  </g>
)

const HexBrickWall = ({ x, y, hex }: { x: number, y: number, hex: number }) => (
  <g>
    {[[0b0001, 0, 0], [0b0010, 8, 0], [0b0100, 0, 8], [0b1000, 8, 8]].map(([mask, dx, dy], index) =>
      <g
        key={index}
        style={{ opacity: (hex & mask) ? 1 : 0.3 }}
        transform={`translate(${dx},${dy})`}
      >
        <BrickWall x={x} y={y} />
        <BrickWall x={x + 4} y={y} />
        <BrickWall x={x} y={y + 4} />
        <BrickWall x={x + 4} y={y + 4} />
      </g>
    )}
  </g>
)

const HexSteelWall = ({ x, y, hex }: { x: number, y: number, hex: number }) => (
  <g>
    <SteelWall x={x} y={y} gstyle={{ opacity: (hex & 0b0001) ? 1 : 0.3 }} />
    <SteelWall x={x + 8} y={y} gstyle={{ opacity: (hex & 0b0010) ? 1 : 0.3 }} />
    <SteelWall x={x} y={y + 8} gstyle={{ opacity: (hex & 0b0100) ? 1 : 0.3 }} />
    <SteelWall x={x + 8} y={y + 8} gstyle={{ opacity: (hex & 0b1000) ? 1 : 0.3 }} />
  </g>
)

type ButtonAreaProps = {
  x: number
  y: number
  width: number
  height: number
  onClick: () => void
  onWheel?: (event: React.WheelEvent<SVGRectElement>) => void
  strokeWidth?: number
}

const ButtonArea = ({ x, y, width, height, onClick, onWheel, strokeWidth = 1 }: ButtonAreaProps) => (
  <rect
    className="button-area"
    x={x - 2}
    y={y - 1}
    width={width + 4}
    height={height + 2}
    onClick={onClick}
    onWheel={onWheel}
    stroke="transparent"
    strokeWidth={strokeWidth}
  />
)

const positionMap = {
  X: B,
  B: 2.5 * B,
  T: 4 * B,
  R: 5.5 * B,
  S: 7 * B,
  F: 8.5 * B,
  E: 10 * B,
}


class Editor extends React.Component {
  private svg: SVGSVGElement
  private pressed = false
  state = {
    map: Repeat(mapItemRecord, FBZ ** 2).toList(),
    itemType: 'X' as MapItemType,
    brickHex: 0xf,
    steelHex: 0xf,
  }

  getT(event: React.MouseEvent<SVGSVGElement>) {
    const row = Math.floor((event.clientY - this.svg.clientTop) / B)
    const col = Math.floor((event.clientX - this.svg.clientLeft) / B)
    if (row >= 0 && row < FBZ && col >= 0 && col < FBZ) {
      return row * FBZ + col
    } else {
      return -1
    }
  }

  getCurrentItem() {
    const { itemType, brickHex, steelHex } = this.state
    if (itemType === 'B') {
      return MapItemRecord({ type: 'B', hex: brickHex })
    } else if (itemType === 'T') {
      return MapItemRecord({ type: 'T', hex: steelHex })
    } else {
      return MapItemRecord({ type: itemType })
    }
  }

  setAsCurrentItem(t: number) {
    const { map } = this.state
    const item = this.getCurrentItem()
    if (t == -1 || is(map.get(t), item)) {
      return
    }
    if (item.type === 'E') {
      // 先将已存在的eagle移除 保证Eagle最多出现一次
      const eagleRemoved = map.map(item => (item.type === 'E' ? mapItemRecord : item))
      this.setState({ map: eagleRemoved.set(t, item) })
    } else {
      this.setState({ map: map.set(t, item) })
    }
  }

  onChangeHex = (type: MapItemType, sign: number) => {
    const { brickHex, steelHex } = this.state
    if (type === 'B') {
      if (sign > 0) {
        this.setState({ brickHex: nextHex(brickHex) })
      } else if (sign < 0) {
        this.setState({ brickHex: prevHex(brickHex) })
      }
    } else if (type === 'T') {
      if (sign > 0) {
        this.setState({ steelHex: nextHex(steelHex) })
      } else if (sign < 0) {
        this.setState({ steelHex: prevHex(steelHex) })
      }
    }
  }

  onClick = (event: React.MouseEvent<SVGSVGElement>) => {
    this.setAsCurrentItem(this.getT(event))
  }

  onMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (this.getT(event) !== -1) {
      this.pressed = true
    }
  }

  onMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (this.pressed) {
      this.setAsCurrentItem(this.getT(event))
    }
  }

  onMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    this.pressed = false
    this.setAsCurrentItem(this.getT(event))
  }

  onMouseLeave = () => {
    this.pressed = false
  }

  onChangeItemType = (nextItemType: MapItemType) => {
    const { itemType, brickHex, steelHex } = this.state
    if (nextItemType !== itemType) {
      this.setState({ itemType: nextItemType })
    } else {
      if (nextItemType === 'B') {
        this.setState({ brickHex: nextHex(brickHex) })
      } else if (nextItemType === 'T') {
        this.setState({ steelHex: nextHex(steelHex) })
      }
    }
  }

  renderRightArrow() {
    const { itemType } = this.state
    return (
      <Text content={'\u2192'} fill="#E91E63" x={0.25 * B} y={0.25 * B + positionMap[itemType]} />
    )
  }

  renderButtonAreas() {
    return (
      <g role="button-areas">
        {Object.entries(positionMap).map(([type, y]: [MapItemType, number]) =>
          <ButtonArea
            key={type}
            x={0.25 * B}
            y={y}
            width={2.5 * B}
            height={B}
            onClick={() => this.onChangeItemType(type)}
            onWheel={event => this.onChangeHex(type, Math.sign(event.deltaY))}
          />
        )}
      </g>
    )
  }

  render() {
    const { map, brickHex, steelHex } = this.state
    const { rivers, steels, bricks, snows, forests, eagle } = parseStageMap(toString(map))

    return (
      <svg
        ref={node => (this.svg = node)}
        className="svg"
        width={16 * B}
        height={15 * B}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
      >
        <g role="board">
          <rect width={FBZ * B} height={FBZ * B} fill="#000000" />
          <RiverLayer rivers={rivers} />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
          <SnowLayer snows={snows} />
          {eagle ?
            <Eagle
              x={eagle.x}
              y={eagle.y}
              broken={eagle.broken}
            />
            : null}
          <ForestLayer forests={forests} />
        </g>
        <DashLines />
        <g role="tools" transform={`translate(${13 * B},0)`}>
          {this.renderRightArrow()}

          <rect x={B} y={B} width={B} height={B} fill="black" />
          <HexBrickWall x={B} y={2.5 * B} hex={brickHex} />
          <HexSteelWall x={B} y={4 * B} hex={steelHex} />
          <River shape={0} x={B} y={5.5 * B} />
          <Snow x={B} y={7 * B} />
          <Forest x={B} y={8.5 * B} />
          <Eagle x={B} y={10 * B} broken={false} />

          {this.renderButtonAreas()}
          <Text content="f" fill="red" x={2.25 * B} y={2.75 * B} />
          <Text content="f" fill="red" x={2.25 * B} y={4.25 * B} />
        </g>
        <g role="menu" transform={`translate(${0.5 * B}, ${13 * B})`}>
          {/* todo 完成4个按钮的逻辑 */}
          <Text x={0} y={0.5 * B} content="map config save load" fill="white" />
        </g>
      </svg>
    )
  }
}


ReactDOM.render(
  <Provider store={simpleStore}>
    <Editor />
  </Provider>,
  document.getElementById('container'),
)
