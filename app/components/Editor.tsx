import { is, List, Repeat } from 'immutable'
import React from 'react'
import { connect } from 'react-redux'
import { match, Redirect, Route } from 'react-router-dom'
import { goBack, replace } from 'react-router-redux'
import { Dispatch } from 'redux'
import { StageConfig, StageDifficulty, State, TankRecord } from '../types/index'
import { defaultBotsConfig, MapItem, MapItemType, StageConfigConverter } from '../types/StageConfig'
import * as actions from '../utils/actions'
import { add, dec, inc } from '../utils/common'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE as FBZ, ZOOM_LEVEL } from '../utils/constants'
import AreaButton from './AreaButton'
import BrickWall from './BrickWall'
import Eagle from './Eagle'
import Forest from './Forest'
import Grid from './Grid'
import PopupProvider, { PopupHandle } from './PopupProvider'
import River from './River'
import Screen from './Screen'
import Snow from './Snow'
import StagePreview from './StagePreview'
import SteelWall from './SteelWall'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'
import TextInput from './TextInput'

const HexBrickWall = ({ x, y, hex }: { x: number; y: number; hex: number }) => (
  <g className="hex-brick-wall">
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
  <g className="hex-steel-wall">
    <g style={{ opacity: hex & 0b0001 ? 1 : 0.3 }}>
      <SteelWall x={x} y={y} />
    </g>
    <g style={{ opacity: hex & 0b0010 ? 1 : 0.3 }}>
      <SteelWall x={x + 8} y={y} />
    </g>
    <g style={{ opacity: hex & 0b0100 ? 1 : 0.3 }}>
      <SteelWall x={x} y={y + 8} />
    </g>
    <g style={{ opacity: hex & 0b1000 ? 1 : 0.3 }}>
      <SteelWall x={x + 8} y={y + 8} />
    </g>
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
  view: string
  dispatch: Dispatch
  initialCotnent: StageConfig
  stages: List<StageConfig>
  popupHandle: PopupHandle
}

class Editor extends React.Component<EditorProps> {
  private svg: SVGSVGElement
  private pressed = false

  state = {
    t: -1,

    name: '',
    difficulty: 1 as StageDifficulty,
    bots: defaultBotsConfig,

    itemList: Repeat(new MapItem(), FBZ ** 2).toList(),
    itemType: 'X' as MapItemType,
    brickHex: 0xf,
    steelHex: 0xf,
  }

  componentDidMount() {
    // custom 在这里不需要取出来，因为 custom 永远为 true
    const { name, difficulty, itemList, bots } = StageConfigConverter.s2e(this.props.initialCotnent)
    this.setState({ name, difficulty, itemList, bots: bots })
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
    const row = Math.floor((event.clientY + totalTop - this.svg.clientTop) / ZOOM_LEVEL / B)
    const col = Math.floor((event.clientX + totalLeft - this.svg.clientLeft) / ZOOM_LEVEL / B)
    if (row >= 0 && row < FBZ && col >= 0 && col < FBZ) {
      return row * FBZ + col
    } else {
      return -1
    }
  }

  getCurrentItem() {
    const { itemType, brickHex, steelHex } = this.state
    if (itemType === 'B') {
      return new MapItem({ type: 'B', hex: brickHex })
    } else if (itemType === 'T') {
      return new MapItem({ type: 'T', hex: steelHex })
    } else {
      return new MapItem({ type: itemType })
    }
  }

  setAsCurrentItem(t: number) {
    const { itemList } = this.state
    const item = this.getCurrentItem()
    if (t == -1 || is(itemList.get(t), item)) {
      return
    }
    if (item.type === 'E') {
      // 先将已存在的eagle移除 保证Eagle最多出现一次
      const eagleRemoved = itemList.map(item => (item.type === 'E' ? new MapItem() : item))
      this.setState({ itemList: eagleRemoved.set(t, item) })
    } else {
      this.setState({ itemList: itemList.set(t, item) })
    }
  }

  onMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    const {
      view,
      popupHandle: { popup },
    } = this.props
    if (view === 'map' && popup == null && this.getT(event) !== -1) {
      this.pressed = true
    }
  }

  onMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const {
      view,
      popupHandle: { popup },
    } = this.props
    const { t: lastT } = this.state
    const t = this.getT(event)
    if (t !== lastT) {
      this.setState({ t })
    }
    if (view === 'map' && popup == null && this.pressed) {
      this.setAsCurrentItem(t)
    }
  }

  onMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    const {
      view,
      popupHandle: { popup },
    } = this.props
    this.pressed = false
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

  onIncBotLevel = (index: number) => {
    const { bots } = this.state
    this.setState({
      bots: bots.update(index, e => e.incTankLevel()),
    })
  }

  onDecBotLevel = (index: number) => {
    const { bots } = this.state
    this.setState({
      bots: bots.update(index, e => e.decTankLevel()),
    })
  }

  onIncBotCount = (index: number) => {
    const { bots } = this.state
    this.setState({
      bots: bots.updateIn([index, 'count'], inc(1)),
    })
  }

  onDecBotCount = (index: number) => {
    const { bots } = this.state
    this.setState({
      bots: bots.updateIn([index, 'count'], dec(1)),
    })
  }

  /** 检查当前编辑器中的关卡配置是否合理. 返回 true 表示关卡配置合理 */
  async check() {
    const {
      stages,
      popupHandle: { showAlertPopup, showConfirmPopup },
    } = this.props
    const { name, bots, itemList } = this.state
    const totalBotCount = bots.map(e => e.count).reduce(add)

    // 检查stageName
    if (name === '') {
      await showAlertPopup('Please enter stage name.')
      this.props.dispatch(replace('/editor/config'))
      return false
    }

    // 检查是否与已有的default-stage 重名
    if (stages.some(s => !s.custom && s.name === name)) {
      await showAlertPopup(`Stage ${name} already exists.`)
      return false
    }

    // 检查bots数量
    if (totalBotCount === 0) {
      await showAlertPopup('no bot.')
      return false
    }

    // 检查老鹰是否存在
    const hasEagle = itemList.some(mapItem => mapItem.type === 'E')
    if (!hasEagle) {
      await showAlertPopup('no eagle.')
      return false
    }

    // 检查是否与已有的custom-stage 重名
    if (stages.some(s => s.custom && s.name === name)) {
      const confirmed = await showConfirmPopup('Override exsiting custome stage. continue?')
      if (!confirmed) {
        return false
      }
    }

    if (totalBotCount !== 20) {
      const confirmed = await showConfirmPopup('total bot count is not 20. continue?')
      if (!confirmed) {
        return false
      }
    }

    return true
  }

  onBack = async () => {
    const { dispatch } = this.props
    dispatch(actions.setEditorContent(this.getStage()))
    dispatch(goBack())
  }

  onSave = async () => {
    if (await this.check()) {
      const { dispatch } = this.props
      const stage = StageConfigConverter.e2s(Object.assign({ custom: true }, this.state))
      dispatch(actions.setCustomStage(stage))
      dispatch(actions.syncCustomStages())
      dispatch(replace('/list/custom'))
    }
  }

  onShowHelpInfo = async () => {
    const {
      popupHandle: { showAlertPopup },
    } = this.props
    await showAlertPopup('1. Choose an item type below.')
    await showAlertPopup('2. Click or pan in the left.')
    await showAlertPopup('3. After selecting Brick or Steel you can change the item shape')
  }

  getStage() {
    return StageConfigConverter.e2s(Object.assign({ custom: false }, this.state))
  }

  renderItemSwitchButtons() {
    return (
      <g className="item-switch-buttons">
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
      <g className="hex-adjust-buttons">
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
    const { brickHex, steelHex, itemType, t } = this.state

    return (
      <g className="map-view">
        <StagePreview disableImageCache stage={this.getStage()} />
        <Grid t={t} />
        <g className="tools" transform={`translate(${13 * B},0)`}>
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
    const { bots, name, difficulty, t } = this.state
    const totalBotCount = bots.map(e => e.count).reduce(add)

    return (
      <g className="config-view">
        <Grid t={t} />
        <Text content="name:" x={3.5 * B} y={1 * B} fill="#ccc" />
        <TextInput
          x={6.5 * B}
          y={B}
          maxLength={12}
          value={name}
          onChange={name => this.setState({ name })}
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

        <Text content="bots:" x={2 * B} y={4 * B} fill="#ccc" />
        <g className="bots-config" transform={`translate(${6 * B}, ${4 * B})`}>
          {bots.map(({ tankLevel, count }, index) => (
            <g key={index} transform={`translate(0, ${1.5 * B * index})`}>
              <TextButton
                content={'\u2190'}
                x={0.25 * B}
                y={0.25 * B}
                disabled={tankLevel === 'basic'}
                onClick={() => this.onDecBotLevel(index)}
              />
              <Tank tank={new TankRecord({ side: 'bot', level: tankLevel, x: B, y: 0 })} />
              <TextButton
                content={'\u2192'}
                x={2.25 * B}
                y={0.25 * B}
                disabled={tankLevel === 'armor'}
                onClick={() => this.onIncBotLevel(index)}
              />
              <TextButton
                content="-"
                x={3.75 * B}
                y={0.25 * B}
                disabled={count === 0}
                onClick={() => this.onDecBotCount(index)}
              />
              <Text content={String(count).padStart(2, '0')} x={4.5 * B} y={0.25 * B} fill="#ccc" />
              <TextButton
                content="+"
                x={5.75 * B}
                y={0.25 * B}
                disabled={count === 99}
                onClick={() => this.onIncBotCount(index)}
              />
            </g>
          ))}
          <Text content="total:" x={0.25 * B} y={6 * B} fill="#ccc" />
          <Text
            content={String(totalBotCount).padStart(2, '0')}
            x={4.5 * B}
            y={6 * B}
            fill="#ccc"
          />
        </g>
      </g>
    )
  }

  render() {
    const {
      dispatch,
      view,
      popupHandle: { popup },
    } = this.props

    return (
      <Screen
        background="#333"
        refFn={node => (this.svg = node)}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
      >
        {view === 'map' ? this.renderMapView() : null}
        {view === 'config' ? this.renderConfigView() : null}
        <g className="menu" transform={`translate(0, ${13 * B})`}>
          <TextButton
            content="config"
            x={0.5 * B}
            y={0.5 * B}
            selected={view === 'config'}
            onClick={() => dispatch(replace('/editor/config'))}
          />
          <TextButton
            content="map"
            x={4 * B}
            y={0.5 * B}
            selected={view === 'map'}
            onClick={() => dispatch(replace('/editor/map'))}
          />
          <TextButton content="save" x={10 * B} y={0.5 * B} onClick={this.onSave} />
          <TextButton content="back" x={12.5 * B} y={0.5 * B} onClick={this.onBack} />
        </g>
        {popup}
      </Screen>
    )
  }
}

const EditorWrapper = ({
  match,
  dispatch,
  initialCotnent,
  stages,
}: EditorProps & { match: match<{ view: string }> }) => (
  <Route
    path={`${match.url}/:view`}
    children={({ match }) => {
      // match 在这里可能为 null
      const view = match && match.params.view
      if (!['map', 'config'].includes(view)) {
        return <Redirect to="/editor/config" />
      }
      return (
        <PopupProvider>
          {popupHandle => (
            <Editor
              view={view}
              dispatch={dispatch}
              initialCotnent={initialCotnent}
              stages={stages}
              popupHandle={popupHandle}
            />
          )}
        </PopupProvider>
      )
    }}
  />
)

const mapStateToProps = (s: State) => ({ initialCotnent: s.editorContent, stages: s.stages })

export default connect(mapStateToProps)(EditorWrapper)
