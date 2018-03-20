import { match, Route, Redirect } from 'react-router-dom'
import { push } from 'react-router-redux'
import { saveAs } from 'file-saver'
import * as React from 'react'
import { Dispatch } from 'redux'
import { is, List, Range, Record, Repeat } from 'immutable'
import { connect } from 'react-redux'
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
import TextInput from 'components/TextInput'
import TextButton from 'components/TextButton'
import parseStageMap from 'utils/parseStageMap'
import { TankRecord } from 'types'
import { inc, dec } from 'utils/common'
import { State } from './reducers'

const zoomLevel = 2
const totalWidth = 16 * B
const totalHeight = 15 * B

function incTankLevel(record: EnemyConfig) {
  if (record.tankLevel === 'basic') {
    return record.set('tankLevel', 'fast')
  } else if (record.tankLevel === 'fast') {
    return record.set('tankLevel', 'power')
  } else {
    return record.set('tankLevel', 'armor')
  }
}

function decTankLevel(record: EnemyConfig) {
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
        if (hex > 0) {
          array.push('B' + hex.toString(16))
        } else {
          array.push('X')
        }
      } else if (type === 'E') {
        array.push('E')
      } else if (type === 'R') {
        array.push('R')
      } else if (type === 'S') {
        array.push('S')
      } else if (type === 'T') {
        if (hex > 0) {
          array.push('T' + hex.toString(16))
        } else {
          array.push('X')
        }
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
  hex: 0xf,
})

const mapItemRecord = MapItemRecord()

export type MapItemRecord = typeof mapItemRecord

export type PopupType = 'alert' | 'confirm'

export class Popup extends Record({
  type: 'alert' as PopupType,
  message: '',
}) {}

export class EnemyConfig extends Record({
  tankLevel: 'basic' as TankLevel,
  count: 0,
}) {}

type DashLinesProps = {
  t?: number
}

class DashLines extends React.PureComponent<DashLinesProps> {
  render() {
    const { t } = this.props
    const hrow = Math.floor(t / FBZ)
    const hcol = t % FBZ

    return (
      <g className="dash-lines" stroke="steelblue" strokeWidth="0.5" strokeDasharray="2 2">
        {Range(1, FBZ + 1)
          .map(col => (
            <line
              key={col}
              x1={B * col}
              y1={0}
              x2={B * col}
              y2={totalHeight}
              strokeOpacity={hcol === col || hcol === col - 1 ? 1 : 0.3}
            />
          ))
          .toArray()}
        {Range(1, FBZ + 1)
          .map(row => (
            <line
              key={row}
              x1={0}
              y1={B * row}
              x2={totalWidth}
              y2={B * row}
              strokeOpacity={hrow === row || hrow === row - 1 ? 1 : 0.3}
            />
          ))
          .toArray()}
      </g>
    )
  }
}

const HexBrickWall = ({ x, y, hex }: { x: number; y: number; hex: number }) => (
  <g role="hex-brick-wall">
    {[[0b0001, 0, 0], [0b0010, 8, 0], [0b0100, 0, 8], [0b1000, 8, 8]].map(
      ([mask, dx, dy], index) => (
        <g
          key={index}
          style={{ opacity: hex & mask ? 1 : 0.3 }}
          transform={`translate(${dx},${dy})`}
        >
          <BrickWall x={x} y={y} />
          <BrickWall x={x + 4} y={y} />
          <BrickWall x={x} y={y + 4} />
          <BrickWall x={x + 4} y={y + 4} />
        </g>
      ),
    )}
  </g>
)

const HexSteelWall = ({ x, y, hex }: { x: number; y: number; hex: number }) => (
  <g role="hex-steel-wall">
    <SteelWall x={x} y={y} gstyle={{ opacity: hex & 0b0001 ? 1 : 0.3 }} />
    <SteelWall x={x + 8} y={y} gstyle={{ opacity: hex & 0b0010 ? 1 : 0.3 }} />
    <SteelWall x={x} y={y + 8} gstyle={{ opacity: hex & 0b0100 ? 1 : 0.3 }} />
    <SteelWall x={x + 8} y={y + 8} gstyle={{ opacity: hex & 0b1000 ? 1 : 0.3 }} />
  </g>
)

type AreaButtonProps = {
  x: number
  y: number
  width: number
  height: number
  onClick: () => void
  strokeWidth?: number
  spreadX?: number
  spreadY?: number
}

const AreaButton = ({
  x,
  y,
  width,
  height,
  onClick,
  strokeWidth = 1,
  spreadX = 2,
  spreadY = 1,
}: AreaButtonProps) => {
  return (
    <rect
      className="area-button"
      x={x - spreadX}
      y={y - spreadY}
      width={width + 2 * spreadX}
      height={height + 2 * spreadY}
      onClick={onClick}
      stroke="transparent"
      strokeWidth={strokeWidth}
    />
  )
}

type TextWithLineWrapProps = {
  x: number
  y: number
  fill?: string
  maxLength: number
  content: string
  lineSpacing?: number
}

// todo 针对单词进行换行
const TextWithLineWrap = ({
  x,
  y,
  fill,
  maxLength,
  content,
  lineSpacing = 0.25 * B,
}: TextWithLineWrapProps) => (
  <g role="text-with-line-wrap">
    {Range(0, Math.ceil(content.length / maxLength))
      .map(index => (
        <Text
          key={index}
          x={x}
          y={y + (0.5 * B + lineSpacing) * index}
          fill={fill}
          content={content.substring(index * maxLength, (index + 1) * maxLength)}
        />
      ))
      .toArray()}
  </g>
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

export interface EditorProps {
  match: match<any>
  dispatch: Dispatch<State>
}

class Editor extends React.Component<EditorProps> {
  private input: HTMLInputElement
  private resetButton: HTMLInputElement
  private form: HTMLFormElement
  private svg: SVGSVGElement
  private pressed = false
  private resolveConfirm: (ok: boolean) => void = null
  private resolveAlert: () => void = null

  state = {
    popup: null as Popup,
    t: -1,

    // map-view
    map: Repeat(mapItemRecord, FBZ ** 2).toList(),
    itemType: 'X' as MapItemType,
    brickHex: 0xf,
    steelHex: 0xf,

    // config-view
    stageName: '',
    difficulty: 1,
    enemies: List<EnemyConfig>([
      new EnemyConfig({ tankLevel: 'basic', count: 10 }),
      new EnemyConfig({ tankLevel: 'fast', count: 4 }),
      new EnemyConfig({ tankLevel: 'power', count: 4 }),
      new EnemyConfig({ tankLevel: 'armor', count: 2 }),
    ]),
  }

  componentDidMount() {
    this.form = document.createElement('form')
    this.resetButton = document.createElement('input')
    this.input = document.createElement('input')

    this.resetButton.type = 'reset'
    this.input.type = 'file'

    this.form.style.display = 'none'

    this.input.addEventListener('change', this.onLoadFile)

    this.form.appendChild(this.input)
    this.form.appendChild(this.resetButton)
    document.body.appendChild(this.form)
  }

  componentWillUnmount() {
    this.input.removeEventListener('change', this.onLoadFile)
    this.form.remove()
  }

  onLoadFile = () => {
    const file = this.input.files[0]
    if (file == null) {
      return
    }
    const fileReader = new FileReader()
    fileReader.readAsText(file)
    fileReader.onloadend = () => {
      try {
        const stage: StageConfig = JSON.parse(fileReader.result)
        this.loadStateFromFileContent(stage)
      } catch (error) {
        this.showAlertPopup('Failed to open file.')
      }
      this.resetButton.click()
    }
  }

  async loadStateFromFileContent(stage: StageConfig) {
    const stageName = stage.name
    const difficulty = stage.difficulty
    const enemies = List(
      stage.enemies.map(line => {
        const splited = line.split('*')
        return new EnemyConfig({
          count: Number(splited[0]),
          tankLevel: splited[1] as TankLevel,
        })
      }),
    )
      .setSize(4)
      .map(v => (v ? v : new EnemyConfig()))
    const map = List(stage.map).flatMap(line => {
      const items = line.trim().split(/ +/)
      return items.map(item => {
        const hex = parseInt(item[1], 16)
        return MapItemRecord({
          type: item[0] as MapItemType,
          hex: isNaN(hex) ? 0 : hex,
        })
      })
    })
    if (await this.showConfirmPopup('This will override current config and map. Continue?')) {
      this.setState({ stageName, difficulty, enemies, map })
    }
  }

  getT(event: React.MouseEvent<SVGSVGElement>) {
    let totalTop = 0
    let totalLeft = 0
    let node: Element = this.svg
    while (node) {
      totalTop += node.scrollTop + node.clientTop
      totalLeft += node.scrollLeft + node.clientLeft
      node = node.parentElement
    }
    const row = Math.floor((event.clientY + totalTop - this.svg.clientTop) / zoomLevel / B)
    const col = Math.floor((event.clientX + totalLeft - this.svg.clientLeft) / zoomLevel / B)
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

  onMouseDown = (view: string, event: React.MouseEvent<SVGSVGElement>) => {
    const { popup } = this.state
    if (view === 'map' && popup == null && this.getT(event) !== -1) {
      this.pressed = true
    }
  }

  onMouseMove = (view: string, event: React.MouseEvent<SVGSVGElement>) => {
    const { popup, t: lastT } = this.state
    const t = this.getT(event)
    if (t !== lastT) {
      this.setState({ t })
    }
    if (view === 'map' && popup == null && this.pressed) {
      this.setAsCurrentItem(t)
    }
  }

  onMouseUp = (view: string, event: React.MouseEvent<SVGSVGElement>) => {
    this.pressed = false
    const { popup } = this.state
    if (view === 'map' && popup == null) {
      this.setAsCurrentItem(this.getT(event))
    }
  }

  onMouseLeave = () => {
    this.pressed = false
    this.setState({ t: -1 })
  }

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

  onRequestLoad = () => {
    this.input.click()
  }

  onSave = async () => {
    const { map, stageName, enemies, difficulty } = this.state
    const totalEnemyCount = enemies.map(e => e.count).reduce((x: number, y) => x + y)

    // 检查stageName
    if (stageName === '') {
      await this.showAlertPopup('Please enter stage name.')
      this.props.dispatch(push('/editor/config'))
      return
    }
    // 检查enemies数量
    if (totalEnemyCount === 0) {
      this.showAlertPopup('no enemy')
      return
    } else if (
      totalEnemyCount !== 20 &&
      !await this.showConfirmPopup('total enemy count is not 20. continue?')
    ) {
      return
    }

    // 检查地图
    const hasEagle = map.some(mapItem => mapItem.type === 'E')
    if (!hasEagle && !await this.showConfirmPopup('no eagle. continue?')) {
      return
    }

    const content = JSON.stringify(
      {
        name: stageName.toLowerCase(),
        difficulty,
        map: toString(map),
        enemies: enemies.filter(e => e.count > 0).map(e => `${e.count}*${e.tankLevel}`),
      },
      null,
      2,
    )
    saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), `stage-${stageName}.json`)
  }

  showAlertPopup(message: string) {
    this.setState({
      popup: new Popup({ type: 'alert', message }),
    })
    return new Promise<boolean>(resolve => {
      this.resolveAlert = resolve
    })
  }

  showConfirmPopup(message: string) {
    this.setState({
      popup: new Popup({ type: 'confirm', message }),
    })
    return new Promise<boolean>(resolve => {
      this.resolveConfirm = resolve
    })
  }

  onConfirm = () => {
    this.resolveConfirm(true)
    this.resolveConfirm = null
    this.setState({ popup: null })
  }

  onCancel = () => {
    this.resolveConfirm(false)
    this.resolveConfirm = null
    this.setState({ popup: null })
  }

  onClickOkOfAlert = () => {
    this.resolveAlert()
    this.resolveAlert = null
    this.setState({ popup: null })
  }

  onShowHelpInfo = async () => {
    await this.showAlertPopup('1. Choose an item type below.')
    await this.showAlertPopup('2. Click or pan in the left.')
    await this.showAlertPopup('3. After selecting Brick or Steel you can change the item shape')
  }

  renderItemSwitchButtons() {
    return (
      <g role="item-switch-buttons">
        {Object.entries(positionMap).map(([type, y]: [MapItemType, number]) => (
          <AreaButton
            key={type}
            x={0.25 * B}
            y={y}
            width={2.5 * B}
            height={B}
            onClick={() => this.setState({ itemType: type })}
          />
        ))}
      </g>
    )
  }

  renderHexAdjustButtons() {
    const { itemType, brickHex, steelHex } = this.state
    let brickHexAdjustButtons: JSX.Element[] = null
    let steelHexAdjustButtons: JSX.Element[] = null

    if (itemType === 'B') {
      brickHexAdjustButtons = [0b0001, 0b0010, 0b0100, 0b1000].map(bin => (
        <AreaButton
          key={bin}
          x={B + (bin & 0b1010 ? 0.5 * B : 0)}
          y={2.5 * B + (bin & 0b1100 ? 0.5 * B : 0)}
          width={0.5 * B}
          height={0.5 * B}
          spreadX={0}
          spreadY={0}
          onClick={() => this.setState({ brickHex: brickHex ^ bin })}
        />
      ))
    }
    if (itemType === 'T') {
      steelHexAdjustButtons = [0b0001, 0b0010, 0b0100, 0b1000].map(bin => (
        <AreaButton
          key={bin}
          x={B + (bin & 0b1010 ? 0.5 * B : 0)}
          y={4 * B + (bin & 0b1100 ? 0.5 * B : 0)}
          width={0.5 * B}
          height={0.5 * B}
          spreadX={0}
          spreadY={0}
          onClick={() => this.setState({ steelHex: steelHex ^ bin })}
        />
      ))
    }
    return (
      <g role="hex-adjust-buttons">
        {brickHexAdjustButtons}
        {steelHexAdjustButtons}
        {itemType === 'B' ? (
          <TextButton
            content="f"
            spreadX={0.125 * B}
            x={2.25 * B}
            y={2.75 * B}
            onClick={() => this.setState({ itemType: 'B', brickHex: 0xf })}
          />
        ) : null}
        {itemType === 'T' ? (
          <TextButton
            content="f"
            spreadX={0.125 * B}
            x={2.25 * B}
            y={4.25 * B}
            onClick={() => this.setState({ itemType: 'T', steelHex: 0xf })}
          />
        ) : null}
      </g>
    )
  }

  renderMapView() {
    const { map, brickHex, steelHex, itemType, t } = this.state
    const { rivers, steels, bricks, snows, forests, eagle } = parseStageMap(toString(map))

    return (
      <g role="map-view">
        <g role="board">
          <rect width={FBZ * B} height={FBZ * B} fill="#000000" />
          <RiverLayer rivers={rivers} />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
          <SnowLayer snows={snows} />
          {eagle ? <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} /> : null}
          <ForestLayer forests={forests} />
        </g>
        <DashLines t={t} />
        <g role="tools" transform={`translate(${13 * B},0)`}>
          <TextButton
            content="?"
            x={2.25 * B}
            y={0.25 * B}
            spreadX={0.05 * B}
            spreadY={0.05 * B}
            onClick={this.onShowHelpInfo}
          />
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

          {this.renderItemSwitchButtons()}
          {this.renderHexAdjustButtons()}
        </g>
      </g>
    )
  }

  renderConfigView() {
    const { enemies, difficulty, stageName, t } = this.state
    const totalEnemyCount = enemies.map(e => e.count).reduce((x: number, y) => x + y)

    return (
      <g role="config-view">
        <DashLines t={t} />
        <Text content="name:" x={3.5 * B} y={1 * B} fill="#ccc" />
        <TextInput
          x={6.5 * B}
          y={B}
          maxLength={12}
          value={stageName}
          onChange={stageName => this.setState({ stageName })}
        />

        <Text content="difficulty:" x={0.5 * B} y={2.5 * B} fill="#ccc" />
        <TextButton
          content="-"
          x={6.25 * B}
          y={2.5 * B}
          disabled={difficulty === 1}
          onClick={this.onDecDifficulty}
        />
        <Text content={String(difficulty)} x={7.25 * B} y={2.5 * B} fill="#ccc" />
        <TextButton
          content="+"
          x={8.25 * B}
          y={2.5 * B}
          disabled={difficulty === 4}
          onClick={this.onIncDifficulty}
        />

        <Text content="enemies:" x={2 * B} y={4 * B} fill="#ccc" />
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
              <Tank tank={new TankRecord({ side: 'ai', level: tankLevel, x: B, y: 0 })} />
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
              <Text content={String(count).padStart(2, '0')} x={4.5 * B} y={0.25 * B} fill="#ccc" />
              <TextButton
                content="+"
                x={5.75 * B}
                y={0.25 * B}
                disabled={count === 99}
                onClick={() => this.onIncEnemyCount(index)}
              />
            </g>
          ))}
          <Text content="total:" x={0.25 * B} y={6 * B} fill="#ccc" />
          <Text
            content={String(totalEnemyCount).padStart(2, '0')}
            x={4.5 * B}
            y={6 * B}
            fill="#ccc"
          />
        </g>
      </g>
    )
  }

  renderPopup() {
    const { popup } = this.state
    if (popup == null) {
      return null
    }

    if (popup.type === 'alert') {
      return (
        <g role="popup-alert">
          <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="transparent" />
          <g transform={`translate(${2.5 * B}, ${4.5 * B})`}>
            <rect x={-0.5 * B} y={-0.5 * B} width={12 * B} height={4 * B} fill="#e91e63" />
            <TextWithLineWrap x={0} y={0} fill="#333" maxLength={22} content={popup.message} />
            <TextButton
              x={9.5 * B}
              y={2.25 * B}
              textFill="#333"
              content="OK"
              onClick={this.onClickOkOfAlert}
            />
          </g>
        </g>
      )
    }

    if (popup.type === 'confirm') {
      return (
        <g role="popup-confirm">
          <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="transparent" />
          <g transform={`translate(${2.5 * B}, ${4.5 * B})`}>
            <rect x={-0.5 * B} y={-0.5 * B} width={12 * B} height={4 * B} fill="#e91e63" />
            <TextWithLineWrap x={0} y={0} fill="#333" maxLength={22} content={popup.message} />
            <TextButton
              x={7.5 * B}
              y={2 * B}
              textFill="#333"
              content="no"
              onClick={this.onCancel}
            />
            <TextButton
              x={9 * B}
              y={2 * B}
              textFill="#333"
              content="yes"
              onClick={this.onConfirm}
            />
          </g>
        </g>
      )
    }
  }

  render() {
    const { match, dispatch } = this.props

    return (
      <Route
        path={`${match.url}/:view`}
        children={({ match }) => {
          // match 在这里可能为 null
          const view = match && match.params.view
          if (!['map', 'config'].includes(view)) {
            return <Redirect to="/editor/config" />
          }
          return (
            <svg
              ref={node => (this.svg = node)}
              className="svg"
              style={{ background: '#333' }}
              width={totalWidth * zoomLevel}
              height={totalHeight * zoomLevel}
              viewBox={`0 0 ${totalWidth} ${totalHeight}`}
              onMouseDown={e => this.onMouseDown(view, e)}
              onMouseUp={e => this.onMouseUp(view, e)}
              onMouseMove={e => this.onMouseMove(view, e)}
              onMouseLeave={this.onMouseLeave}
            >
              {view === 'map' ? this.renderMapView() : null}
              {view === 'config' ? this.renderConfigView() : null}
              <g role="menu" transform={`translate(0, ${13 * B})`}>
                <TextButton
                  content="config"
                  x={0.5 * B}
                  y={0.5 * B}
                  selected={view === 'config'}
                  onClick={() => dispatch(push('/editor/config'))}
                />
                <TextButton
                  content="map"
                  x={4 * B}
                  y={0.5 * B}
                  selected={view === 'map'}
                  onClick={() => dispatch(push('/editor/map'))}
                />
                <TextButton content="load" x={7 * B} y={0.5 * B} onClick={this.onRequestLoad} />
                <TextButton content="save" x={9.5 * B} y={0.5 * B} onClick={this.onSave} />
              </g>
              {this.renderPopup()}
            </svg>
          )
        }}
      />
    )
  }
}

export default connect()(Editor)
