import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  BLOCK_SIZE as B,
  FIELD_BLOCK_SIZE as FBZ,
  TANK_LEVELS,
  ZOOM_LEVEL,
} from '../../engine/constants'
import type { MapItemType, TankLevel } from '../../engine/types'
import { stages as builtinStages } from '../../stages'
import {
  EMPTY_ITEM,
  editorToRaw,
  emptyEditorStage,
  rawToEditor,
  type EditorStage,
  type MapItem,
} from '../editor/editorStage'
import Grid from '../editor/Grid'
import TerrainIcon, { type TerrainIconName } from '../editor/TerrainIcon'
import { menuKeyOf, useMenuKeys, type MenuKey } from '../menuKeys'
import AreaButton from '../pixel/AreaButton'
import FocusFrame from '../pixel/FocusFrame'
import HintText from '../pixel/HintText'
import PixelText from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import StagePreview from '../pixel/StagePreview'
import TankSvg from '../pixel/TankSvg'
import TextButton from '../pixel/TextButton'
import TextInput from '../pixel/TextInput'
import useHelp from '../pixel/useHelp'
import usePopup from '../pixel/usePopup'
import { goBack, replace, type EditorView } from '../router'
import { useUIStore } from '../store'

/** 工具栏中各画笔的纵坐标；键盘上下切换与数字键 1–7 都按这个顺序 */
const TOOL_Y: Record<MapItemType, number> = {
  X: B,
  B: 2.5 * B,
  T: 4 * B,
  R: 5.5 * B,
  S: 7 * B,
  F: 8.5 * B,
  E: 10 * B,
}
const TOOLS = Object.keys(TOOL_Y) as MapItemType[]
const TOOLS_X = 13 * B

const QUADRANTS = [0b0001, 0b0010, 0b0100, 0b1000]

/** 象限位在 16×16 block 内的偏移：2 / 8 在右半，4 / 8 在下半 */
function quadrantOffset(bit: number): [number, number] {
  return [bit & 0b1010 ? 0.5 * B : 0, bit & 0b1100 ? 0.5 * B : 0]
}

/** config 视图可聚焦的字段：name、difficulty，然后每组 bot 依次是等级、数量 */
const BOT_GROUPS = 4
const CONFIG_FIELDS = 2 + BOT_GROUPS * 2
const BOTS_X = 6 * B
const BOTS_Y = 4 * B
const BOT_ROW_HEIGHT = 1.5 * B

const MENU_ITEMS = ['config', 'map', 'save', 'back'] as const

/**
 * 键盘焦点。map 视图：地图光标、画笔栏、砖/钢的形状象限；
 * config 视图：字段；两个视图共用底部菜单。
 */
type Focus =
  | { area: 'map'; t: number }
  | { area: 'tools'; tool: MapItemType }
  | { area: 'shape'; target: number | 'f' }
  | { area: 'config'; field: number }
  | { area: 'menu'; index: number }

const MAP_CENTER = Math.floor(FBZ / 2) * FBZ + Math.floor(FBZ / 2)

function HexIcon({ name, y, hex }: { name: TerrainIconName; y: number; hex: number }) {
  return (
    <g>
      {QUADRANTS.map((bit) => {
        const [dx, dy] = quadrantOffset(bit)
        return (
          <TerrainIcon key={bit} name={name} x={B + dx} y={y + dy} opacity={hex & bit ? 1 : 0.3} />
        )
      })}
    </g>
  )
}

function shiftLevel(level: TankLevel, delta: 1 | -1): TankLevel {
  return TANK_LEVELS[TANK_LEVELS.indexOf(level) + delta]
}

/** 关卡编辑器：还原原版 Editor（config / map 两个视图 + 保存校验），并支持全键盘操作 */
export default function Editor({ view }: { view: EditorView }) {
  const customStages = useUIStore((s) => s.customStages)
  const addCustomStage = useUIStore((s) => s.addCustomStage)
  const setEditorContent = useUIStore((s) => s.setEditorContent)
  const bindings = useUIStore((s) => s.bindings)
  const [stage, setStage] = useState<EditorStage>(() => {
    const content = useUIStore.getState().editorContent
    return content == null ? emptyEditorStage() : rawToEditor(content)
  })
  const [itemType, setItemType] = useState<MapItemType>('X')
  const [brickHex, setBrickHex] = useState(0xf)
  const [steelHex, setSteelHex] = useState(0xf)
  const [hovered, setHovered] = useState(-1)
  const pressedRef = useRef(false)
  const { popup, open: popupOpen, showAlert, showConfirm } = usePopup()
  const raw = useMemo(() => editorToRaw(stage), [stage])
  const [focus, setFocus] = useState<Focus>(() =>
    view === 'map' ? { area: 'map', t: MAP_CENTER } : { area: 'config', field: 0 },
  )
  const [editingName, setEditingName] = useState(false)
  const nameInputRef = useRef<SVGGElement>(null)
  // 按住开火键移动地图光标时连续涂抹
  const keyPaintingRef = useRef(false)
  const lastMapTRef = useRef(MAP_CENTER)
  const help = useHelp(
    [
      [
        {
          rows: [
            ['direction', 'move'],
            ['fire', 'paint / ok'],
            ['1-7', 'brush'],
            ['right', 'edit shape'],
            ['left/right', 'adjust'],
            ['esc', 'back'],
          ],
        },
      ],
    ],
    !popupOpen && !editingName,
  )

  const canPaint = view === 'map' && !popupOpen
  const totalBotCount = stage.bots.reduce((sum, g) => sum + g.count, 0)

  // 用鼠标切换视图时焦点可能还停在另一个视图的区域里，就近换成当前视图的区域
  let current = focus
  if (view === 'map' && current.area === 'config') current = { area: 'map', t: lastMapTRef.current }
  if (
    view === 'config' &&
    (current.area === 'map' || current.area === 'tools' || current.area === 'shape')
  ) {
    current = { area: 'config', field: 0 }
  }
  if (current.area === 'shape' && itemType !== 'B' && itemType !== 'T') {
    current = { area: 'tools', tool: itemType }
  }
  if (current.area === 'map') lastMapTRef.current = current.t

  const update = (patch: Partial<EditorStage>) => setStage((s) => ({ ...s, ...patch }))

  const updateBot = (index: number, patch: Partial<EditorStage['bots'][number]>) =>
    setStage((s) => ({
      ...s,
      bots: s.bots.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    }))

  const blockAt = (event: MouseEvent<SVGSVGElement>): number => {
    const rect = event.currentTarget.getBoundingClientRect()
    const row = Math.floor((event.clientY - rect.top) / ZOOM_LEVEL / B)
    const col = Math.floor((event.clientX - rect.left) / ZOOM_LEVEL / B)
    return row >= 0 && row < FBZ && col >= 0 && col < FBZ ? row * FBZ + col : -1
  }

  const paint = (t: number) => {
    if (t === -1) return
    const item: MapItem =
      itemType === 'B'
        ? { type: 'B', hex: brickHex }
        : itemType === 'T'
          ? { type: 'T', hex: steelHex }
          : { type: itemType, hex: 0xf }
    setStage((s) => {
      if (s.items[t].type === item.type && s.items[t].hex === item.hex) return s
      // 老鹰最多出现一次：放置新老鹰时移除旧的
      const items = s.items.map((it) => (item.type === 'E' && it.type === 'E' ? EMPTY_ITEM : it))
      items[t] = item
      return { ...s, items }
    })
  }

  /** 保存前校验，返回 true 表示可以保存 */
  const check = async (): Promise<boolean> => {
    if (stage.name === '') {
      await showAlert('Please enter stage name.')
      replace('/editor/config')
      return false
    }
    if (builtinStages.some((s) => s.name === raw.name)) {
      await showAlert(`Stage ${raw.name} already exists.`)
      return false
    }
    if (totalBotCount === 0) {
      await showAlert('no bot.')
      return false
    }
    if (!stage.items.some((it) => it.type === 'E')) {
      await showAlert('no eagle.')
      return false
    }
    if (
      customStages.some((s) => s.name === raw.name) &&
      !(await showConfirm('Override existing custom stage. Continue?'))
    ) {
      return false
    }
    if (totalBotCount !== 20 && !(await showConfirm('total bot count is not 20. continue?'))) {
      return false
    }
    return true
  }

  const onSave = async () => {
    if (await check()) {
      addCustomStage({ ...raw, custom: true })
      replace('/list/custom')
    }
  }

  const onBack = () => {
    // 回写编辑内容，下次进入编辑器时继续
    setEditorContent(raw)
    goBack()
  }

  const runMenu = (index: number) => {
    const item = MENU_ITEMS[index]
    if (item === 'config' || item === 'map') replace(`/editor/${item}`)
    else if (item === 'save') void onSave()
    else onBack()
  }

  const toggleShape = (target: number | 'f') => {
    const setHex = itemType === 'B' ? setBrickHex : setSteelHex
    setHex((hex) => (target === 'f' ? 0xf : hex ^ target))
  }

  const adjustConfig = (field: number, delta: 1 | -1) => {
    if (field === 1) {
      const difficulty = stage.difficulty + delta
      if (difficulty >= 1 && difficulty <= 4) {
        update({ difficulty: difficulty as EditorStage['difficulty'] })
      }
    } else if (field >= 2) {
      const index = Math.floor((field - 2) / 2)
      const { tankLevel, count } = stage.bots[index]
      if (field % 2 === 0) {
        const level = TANK_LEVELS.indexOf(tankLevel) + delta
        if (level >= 0 && level < TANK_LEVELS.length)
          updateBot(index, { tankLevel: TANK_LEVELS[level] })
      } else if (count + delta >= 0 && count + delta <= 99) {
        updateBot(index, { count: count + delta })
      }
    }
  }

  const menuFocusOfView = (): Focus => ({ area: 'menu', index: view === 'map' ? 1 : 0 })

  const onMapKey = (key: MenuKey, t: number) => {
    const row = Math.floor(t / FBZ)
    const col = t % FBZ
    let next = t
    if (key === 'left' && col > 0) next = t - 1
    else if (key === 'up' && row > 0) next = t - FBZ
    else if (key === 'right') {
      if (col === FBZ - 1) return setFocus({ area: 'tools', tool: itemType })
      next = t + 1
    } else if (key === 'down') {
      if (row === FBZ - 1) return setFocus(menuFocusOfView())
      next = t + FBZ
    } else if (key === 'confirm') {
      keyPaintingRef.current = true
      return paint(t)
    } else if (key === 'back') {
      return onBack()
    }
    if (keyPaintingRef.current) paint(next)
    setFocus({ area: 'map', t: next })
  }

  const onToolsKey = (key: MenuKey, tool: MapItemType) => {
    const index = TOOLS.indexOf(tool)
    const select = (next: MapItemType) => {
      setItemType(next)
      setFocus({ area: 'tools', tool: next })
    }
    if (key === 'up' && index > 0) select(TOOLS[index - 1])
    else if (key === 'down') {
      if (index < TOOLS.length - 1) select(TOOLS[index + 1])
      else setFocus(menuFocusOfView())
    } else if (key === 'right' && (tool === 'B' || tool === 'T')) {
      setFocus({ area: 'shape', target: QUADRANTS[0] })
    } else if (key === 'left' || key === 'confirm' || key === 'back') {
      setFocus({ area: 'map', t: lastMapTRef.current })
    }
  }

  /** 形状象限按 2×2 排列，右侧是恢复整块的 f 按钮 */
  const onShapeKey = (key: MenuKey, target: number | 'f') => {
    if (key === 'confirm') return toggleShape(target)
    if (key === 'back') return setFocus({ area: 'tools', tool: itemType })
    if (target === 'f') {
      if (key === 'left') setFocus({ area: 'shape', target: 0b0010 })
      return
    }
    const right = (target & 0b1010) !== 0
    const bottom = (target & 0b1100) !== 0
    if (key === 'left') {
      setFocus(right ? { area: 'shape', target: target >> 1 } : { area: 'tools', tool: itemType })
    } else if (key === 'right') {
      setFocus(right ? { area: 'shape', target: 'f' } : { area: 'shape', target: target << 1 })
    } else if (key === 'up' && bottom) setFocus({ area: 'shape', target: target >> 2 })
    else if (key === 'down' && !bottom) setFocus({ area: 'shape', target: target << 2 })
  }

  const onConfigKey = (key: MenuKey, field: number) => {
    if (key === 'up' && field > 0) setFocus({ area: 'config', field: field - 1 })
    else if (key === 'down') {
      setFocus(field < CONFIG_FIELDS - 1 ? { area: 'config', field: field + 1 } : menuFocusOfView())
    } else if (key === 'left') adjustConfig(field, -1)
    else if (key === 'right') adjustConfig(field, 1)
    else if (key === 'confirm' && field === 0) nameInputRef.current?.focus()
    else if (key === 'back') onBack()
  }

  const onMenuKey = (key: MenuKey, index: number) => {
    if (key === 'left') setFocus({ area: 'menu', index: Math.max(0, index - 1) })
    else if (key === 'right') {
      setFocus({ area: 'menu', index: Math.min(MENU_ITEMS.length - 1, index + 1) })
    } else if (key === 'up') {
      setFocus(
        view === 'map'
          ? { area: 'map', t: lastMapTRef.current }
          : { area: 'config', field: CONFIG_FIELDS - 1 },
      )
    } else if (key === 'confirm') runMenu(index)
    else if (key === 'back') onBack()
  }

  useMenuKeys((key) => {
    if (current.area === 'map') onMapKey(key, current.t)
    else if (current.area === 'tools') onToolsKey(key, current.tool)
    else if (current.area === 'shape') onShapeKey(key, current.target)
    else if (current.area === 'config') onConfigKey(key, current.field)
    else onMenuKey(key, current.index)
  }, !popupOpen)

  // 数字键 1–7 直接切换画笔；松开确认键结束连续涂抹
  useEffect(() => {
    const controls = [bindings.p1, bindings.p2]
    const onKeyDown = (e: KeyboardEvent) => {
      if (view !== 'map' || popupOpen) return
      const match = /^(?:Digit|Numpad)([1-7])$/.exec(e.code)
      if (match != null) setItemType(TOOLS[Number(match[1]) - 1])
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (menuKeyOf(e.code, controls) === 'confirm') keyPaintingRef.current = false
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [bindings, view, popupOpen])

  const renderHexAdjust = (type: 'B' | 'T') => {
    const [hex, setHex] = type === 'B' ? [brickHex, setBrickHex] : [steelHex, setSteelHex]
    const y = TOOL_Y[type]
    const shapeFocus = current.area === 'shape' ? current.target : null
    return (
      <g>
        {QUADRANTS.map((bit) => {
          const [dx, dy] = quadrantOffset(bit)
          return (
            <g key={bit}>
              <AreaButton
                x={B + dx}
                y={y + dy}
                width={0.5 * B}
                height={0.5 * B}
                spreadX={0}
                spreadY={0}
                onClick={() => setHex(hex ^ bit)}
              />
              {shapeFocus === bit && (
                <FocusFrame x={B + dx} y={y + dy} width={0.5 * B} height={0.5 * B} />
              )}
            </g>
          )
        })}
        <TextButton
          content="f"
          spreadX={0.125 * B}
          x={2.25 * B}
          y={y + 0.25 * B}
          focused={shapeFocus === 'f'}
          onClick={() => setHex(0xf)}
        />
      </g>
    )
  }

  const toolFocus = current.area === 'tools' ? current.tool : null

  const mapView = (
    <g className="map-view">
      <StagePreview stage={raw} />
      <Grid t={current.area === 'map' ? current.t : hovered} />
      {current.area === 'map' && (
        <FocusFrame
          x={(current.t % FBZ) * B}
          y={Math.floor(current.t / FBZ) * B}
          width={B}
          height={B}
        />
      )}
      <g className="tools" transform={`translate(${TOOLS_X},0)`}>
        <PixelText content="→" fill="#E91E63" x={0.25 * B} y={0.25 * B + TOOL_Y[itemType]} />

        <rect x={B} y={TOOL_Y.X} width={B} height={B} fill="black" />
        <HexIcon name="brick" y={TOOL_Y.B} hex={brickHex} />
        <HexIcon name="steel" y={TOOL_Y.T} hex={steelHex} />
        <TerrainIcon name="river" x={B} y={TOOL_Y.R} />
        <TerrainIcon name="snow" x={B} y={TOOL_Y.S} />
        <TerrainIcon name="forest" x={B} y={TOOL_Y.F} />
        <TerrainIcon name="eagle" x={B} y={TOOL_Y.E} />

        {TOOLS.map((type) => (
          <AreaButton
            key={type}
            x={0.25 * B}
            y={TOOL_Y[type]}
            width={2.5 * B}
            height={B}
            onClick={() => setItemType(type)}
          />
        ))}
        {toolFocus != null && (
          <FocusFrame x={0} y={TOOL_Y[toolFocus] - 2} width={3 * B} height={B + 4} />
        )}
        {itemType === 'B' && renderHexAdjust('B')}
        {itemType === 'T' && renderHexAdjust('T')}
      </g>
    </g>
  )

  const configFocus = current.area === 'config' ? current.field : null
  const botFrameY = (index: number) => BOTS_Y + BOT_ROW_HEIGHT * index

  const configView = (
    <g className="config-view">
      <Grid t={hovered} />
      <PixelText content="name:" x={3.5 * B} y={1 * B} fill="#ccc" />
      <TextInput
        ref={nameInputRef}
        x={6.5 * B}
        y={B}
        maxLength={12}
        value={stage.name}
        onChange={(name) => update({ name })}
        onFocusChange={setEditingName}
      />
      {configFocus === 0 && !editingName && (
        <FocusFrame x={6.5 * B - 4} y={B - 4} width={12 * 0.5 * B + 8} height={0.5 * B + 8} />
      )}

      <PixelText content="difficulty:" x={0.5 * B} y={2.5 * B} fill="#ccc" />
      <TextButton
        content="-"
        x={6.25 * B}
        y={2.5 * B}
        disabled={stage.difficulty === 1}
        onClick={() => update({ difficulty: (stage.difficulty - 1) as EditorStage['difficulty'] })}
      />
      <PixelText content={String(stage.difficulty)} x={7.25 * B} y={2.5 * B} fill="#ccc" />
      <TextButton
        content="+"
        x={8.25 * B}
        y={2.5 * B}
        disabled={stage.difficulty === 4}
        onClick={() => update({ difficulty: (stage.difficulty + 1) as EditorStage['difficulty'] })}
      />
      {configFocus === 1 && <FocusFrame x={6 * B} y={2.25 * B} width={3 * B} height={B} />}

      <PixelText content="bots:" x={2 * B} y={4 * B} fill="#ccc" />
      <g className="bots-config" transform={`translate(${BOTS_X}, ${BOTS_Y})`}>
        {stage.bots.map(({ tankLevel, count }, index) => (
          <g key={index} transform={`translate(0, ${BOT_ROW_HEIGHT * index})`}>
            <TextButton
              content="←"
              x={0.25 * B}
              y={0.25 * B}
              disabled={tankLevel === 'basic'}
              onClick={() => updateBot(index, { tankLevel: shiftLevel(tankLevel, -1) })}
            />
            <TankSvg side="bot" level={tankLevel} color="silver" x={B} y={0} />
            <TextButton
              content="→"
              x={2.25 * B}
              y={0.25 * B}
              disabled={tankLevel === 'armor'}
              onClick={() => updateBot(index, { tankLevel: shiftLevel(tankLevel, 1) })}
            />
            <TextButton
              content="-"
              x={3.75 * B}
              y={0.25 * B}
              disabled={count === 0}
              onClick={() => updateBot(index, { count: count - 1 })}
            />
            <PixelText
              content={String(count).padStart(2, '0')}
              x={4.5 * B}
              y={0.25 * B}
              fill="#ccc"
            />
            <TextButton
              content="+"
              x={5.75 * B}
              y={0.25 * B}
              disabled={count === 99}
              onClick={() => updateBot(index, { count: count + 1 })}
            />
          </g>
        ))}
        <PixelText content="total:" x={0.25 * B} y={6 * B} fill="#ccc" />
        <PixelText
          content={String(totalBotCount).padStart(2, '0')}
          x={4.5 * B}
          y={6 * B}
          fill="#ccc"
        />
      </g>
      {configFocus != null && configFocus >= 2 && (
        <FocusFrame
          x={BOTS_X + (configFocus % 2 === 0 ? 0 : 3.5 * B)}
          y={botFrameY(Math.floor((configFocus - 2) / 2)) - 2}
          width={3 * B}
          height={B + 4}
        />
      )}
    </g>
  )

  return (
    <Screen
      background="#333"
      onMouseDown={(e) => {
        if (canPaint && blockAt(e) !== -1) pressedRef.current = true
      }}
      onMouseMove={(e) => {
        const t = blockAt(e)
        if (t !== hovered) setHovered(t)
        if (canPaint && pressedRef.current) paint(t)
      }}
      onMouseUp={(e) => {
        pressedRef.current = false
        if (canPaint) paint(blockAt(e))
      }}
      onMouseLeave={() => {
        pressedRef.current = false
        setHovered(-1)
      }}
    >
      {view === 'map' ? mapView : configView}
      <g className="menu" transform={`translate(0, ${13 * B})`}>
        {MENU_ITEMS.map((item, i) => (
          <TextButton
            key={item}
            content={item}
            x={[0.5, 4, 10, 12.5][i] * B}
            y={0.5 * B}
            selected={item === view}
            focused={current.area === 'menu' && current.index === i}
            onClick={() => runMenu(i)}
          />
        ))}
      </g>
      {editingName && <HintText content="type stage name  enter done" />}
      {!editingName && help.button}
      {popup}
      {help.overlay}
    </Screen>
  )
}
