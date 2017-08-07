import 'normalize.css'
import { saveAs } from 'file-saver'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as classNames from 'classnames'
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
import { Tank } from 'components/tanks'
import BrickWall from 'components/BrickWall'
import SteelWall from 'components/SteelWall'
import tickEmitter from 'sagas/tickEmitter'
import { time } from 'reducers/index'
import game from 'reducers/game'
import parseStageMap from 'utils/parseStageMap'
import { TankRecord } from 'types'
import { inc, dec } from 'utils/common'

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

function incTankLevel(record: EnemyConfigRecord) {
  if (record.tankLevel === 'basic') {
    return record.set('tankLevel', 'fast')
  } else if (record.tankLevel === 'fast') {
    return record.set('tankLevel', 'power')
  } else {
    return record.set('tankLevel', 'armor')
  }
}

function decTankLevel(record: EnemyConfigRecord) {
  if (record.tankLevel === 'armor') {
    return record.set('tankLevel', 'power')
  } else if (record.tankLevel === 'power') {
    return record.set('tankLevel', 'fast')
  } else {
    return record.set('tankLevel', 'basic')
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
      } else {
        array.push('X')
      }
    }
    result.push(array.map(s => s.padEnd(3)).join(''))
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

export const EnemyConfigRecord = Record({
  tankLevel: 'basic' as TankLevel,
  count: 0,
})

const enemyConfigRecord = EnemyConfigRecord()

export type EnemyConfigRecord = typeof enemyConfigRecord

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

type TextButtonProps = {
  x: number
  y: number
  content: string
  spreadX?: number
  spreadY?: number
  onClick?: () => void
  selected?: boolean
  textFill?: string
  disabled?: boolean
}

const TextButton = ({
  x,
  y,
  content,
  spreadX = 0.25 * B,
  spreadY = 0.125 * B,
  onClick,
  selected,
  textFill = 'white',
  disabled = false,
}: TextButtonProps) => {
  return (
    <g role="text-button">
      <rect
        className={classNames('text-area', { selected, disabled })}
        x={x - spreadX}
        y={y - spreadY}
        width={content.length * 0.5 * B + 2 * spreadX}
        height={0.5 * B + 2 * spreadY}
        onClick={disabled ? null : onClick}
      />
      <Text
        style={{ pointerEvents: 'none', opacity: disabled ? 0.3 : 1 }}
        x={x}
        y={y}
        content={content}
        fill={textFill}
      />
    </g>
  )
}

type TextInputProps = {
  x: number
  y: number
  maxLength: number
  value: string
  onChange: (newValue: string) => void
}

class TextInput extends React.Component<TextInputProps, { focused: boolean }> {
  input: HTMLInputElement

  constructor(props: TextInputProps) {
    super(props)
    this.state = {
      focused: false,
    }
  }

  componentDidMount() {
    this.input = document.createElement('input')
    this.input.type = 'text'
    this.input.value = this.props.value

    // this styles will make input invisible
    this.input.style.position = 'absolute'
    this.input.style.width = '0'
    this.input.style.border = 'none'

    this.input.addEventListener('blur', this.onBlur)
    this.input.addEventListener('input', this.onInput)

    document.body.appendChild(this.input)
  }

  componentWillUnmount() {
    this.input.removeEventListener('blur', this.onBlur)
    this.input.removeEventListener('input', this.onInput)

    this.input.remove()
  }

  onBlur = () => this.setState({ focused: false })

  onInput = () => {
    const { maxLength } = this.props
    const rawValue = this.input.value
    const value = Array.from(rawValue).filter(Text.support).join('').substring(0, maxLength)
    this.input.value = value
    this.props.onChange(value)
  }

  onFocus = () => {
    this.input.focus()
    this.setState({ focused: true })
  }

  render() {
    const { x, y, maxLength, value } = this.props
    const { focused } = this.state
    return (
      <g onClick={this.onFocus}>
        <rect
          x={x - 2}
          y={y - 2}
          height={0.5 * B + 4}
          width={maxLength * 0.5 * B + 4}
          fill="transparent"
          stroke="#e91e63"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <Text x={x} y={y} content={value} fill="white" />
        <rect
          x={x + value.length * 8}
          y={y - 1.5}
          width="1"
          height="11"
          fill={focused ? 'orange' : 'transparent'}
        />
      </g>
    )
  }
}

const positionMap = {
  X: B,
  B: 2.5 * B,
  T: 4 * B,
  R: 5.5 * B,
  S: 7 * B,
  F: 8.5 * B,
  E: 10 * B,
}

type EditorView = 'map' | 'config'

class Editor extends React.Component {
  private svg: SVGSVGElement
  private pressed = false
  state = {
    view: 'config' as EditorView,

    // map-view
    map: Repeat(mapItemRecord, FBZ ** 2).toList(),
    itemType: 'X' as MapItemType,
    brickHex: 0xf,
    steelHex: 0xf,

    // config-view
    stageName: '',
    difficulty: 1,
    enemies: List<EnemyConfigRecord>([
      EnemyConfigRecord({ tankLevel: 'basic', count: 10 }),
      EnemyConfigRecord({ tankLevel: 'fast', count: 4 }),
      EnemyConfigRecord({ tankLevel: 'power', count: 4 }),
      EnemyConfigRecord({ tankLevel: 'armor', count: 2 }),
    ]),
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

  onMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    const { view } = this.state
    if (view === 'map' && this.getT(event) !== -1) {
      this.pressed = true
    }
  }

  onMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const { view } = this.state
    if (view === 'map' && this.pressed) {
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

  onChangeView = (view: EditorView) => this.setState({ view })

  onIncDifficulty = () => {
    const { difficulty } = this.state
    this.setState({ difficulty: difficulty + 1 })
  }

  onDecDifficulty = () => {
    const { difficulty } = this.state
    this.setState({ difficulty: difficulty - 1 })
  }

  onIncEnemyLevel = (index: number) => {
    const { enemies } = this.state
    this.setState({ enemies: enemies.update(index, incTankLevel) })
  }

  onDecEnemyLevel = (index: number) => {
    const { enemies } = this.state
    this.setState({ enemies: enemies.update(index, decTankLevel) })
  }

  onIncEnemyCount = (index: number) => {
    const { enemies } = this.state
    this.setState({ enemies: enemies.updateIn([index, 'count'], inc(1)) })
  }

  onDecEnemyCount = (index: number) => {
    const { enemies } = this.state
    this.setState({ enemies: enemies.updateIn([index, 'count'], dec(1)) })
  }

  onLoad = () => {
    // todo
    console.log('on-load')
  }

  onSave = () => {
    const { map, stageName, enemies, difficulty } = this.state
    const content = JSON.stringify({
      name: stageName.toLowerCase(),
      difficulty,
      map: toString(map),
      enemies: enemies.filter(e => e.count > 0)
        .map(e => `${e.count}*${e.tankLevel}`),
    }, null, 2)
    saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), 'stage.json')
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

  renderMapView() {
    const { map, brickHex, steelHex, itemType } = this.state
    const { rivers, steels, bricks, snows, forests, eagle } = parseStageMap(toString(map))

    return (
      <g>
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
          <Text
            content={'\u2192'}
            fill="#E91E63"
            x={0.25 * B}
            y={0.25 * B + positionMap[itemType]}
          />

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
      </g>
    )
  }

  renderConfigView() {
    const { enemies, difficulty, stageName } = this.state
    const totalEnemyCount = enemies.map(e => e.count).reduce((x: number, y) => x + y)

    return (
      <g>
        <DashLines />
        <Text content="       name:" x={0} y={1 * B} fill="white" />
        <TextInput
          x={6.5 * B}
          y={B}
          maxLength={12}
          value={stageName}
          onChange={stageName => this.setState({ stageName })}
        />

        <Text content=" difficulty:" x={0} y={2.5 * B} fill="white" />
        <TextButton
          content="-"
          x={6.25 * B}
          y={2.5 * B}
          disabled={difficulty === 1}
          onClick={this.onDecDifficulty}
        />
        <Text content={String(difficulty)} x={7.25 * B} y={2.5 * B} fill="white" />
        <TextButton
          content="+"
          x={8.25 * B}
          y={2.5 * B}
          disabled={difficulty === 4}
          onClick={this.onIncDifficulty}
        />

        <Text content="    enemies:" x={0} y={4 * B} fill="white" />
        <g role="enemies-config" transform={`translate(${6 * B}, ${4 * B})`}>
          {enemies.map(({ tankLevel, count }, index) => (
            <g key={index} transform={`translate(0, ${1.5 * B * index})`}>
              <TextButton
                content={'\u2190'}
                x={0.25 * B}
                y={0.25 * B}
                disabled={tankLevel === 'basic'}
                onClick={() => this.onDecEnemyLevel(index)}
              />
              <Tank tank={TankRecord({ side: 'ai', level: tankLevel, x: B, y: 0 })} />
              <TextButton
                content={'\u2192'}
                x={2.25 * B}
                y={0.25 * B}
                disabled={tankLevel === 'armor'}
                onClick={() => this.onIncEnemyLevel(index)}
              />
              <TextButton
                content="-"
                x={3.75 * B}
                y={0.25 * B}
                disabled={count === 0}
                onClick={() => this.onDecEnemyCount(index)}
              />
              <Text
                content={String(count).padStart(2, '0')}
                x={4.5 * B}
                y={0.25 * B}
                fill="white"
              />
              <TextButton
                content="+"
                x={5.75 * B}
                y={0.25 * B}
                disabled={count === 99}
                onClick={() => this.onIncEnemyCount(index)}
              />
            </g>
          ))}
          <Text content="total:" x={0.25 * B} y={6 * B} />
          <Text
            content={String(totalEnemyCount).padStart(2, '0')}
            x={4.5 * B}
            y={6 * B}
          />
        </g>
      </g>
    )
  }

  render() {
    const { view } = this.state

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
        {view === 'map' ? this.renderMapView() : null}
        {view === 'config' ? this.renderConfigView() : null}
        <g role="menu" transform={`translate(0, ${13 * B})`}>
          <TextButton
            content="map"
            x={0.5 * B}
            y={0.5 * B}
            selected={view === 'map'}
            onClick={() => this.onChangeView('map')}
          />
          <TextButton
            content="config" x={2.5 * B} y={0.5 * B} selected={view === 'config'}
            onClick={() => this.onChangeView('config')}
          />
          <TextButton
            content="load"
            x={7 * B}
            y={0.5 * B}
            onClick={this.onLoad}
          />
          <TextButton
            content="save"
            x={9.5 * B}
            y={0.5 * B}
            onClick={this.onSave}
          />
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
