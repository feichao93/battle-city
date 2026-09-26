import { useRef, useState } from 'react'
import { BLOCK_SIZE as B } from '../../engine/constants'
import { parseStage } from '../../engine/map/parseStage'
import type { RawStageConfig } from '../../engine/types'
import { stages as builtinStages } from '../../stages'
import { MAX_BOT_GROUPS } from '../editor/editorStage'
import { useMenuKeys, type MenuKey } from '../menuKeys'
import FocusFrame from '../pixel/FocusFrame'
import PixelText from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import StagePreview from '../pixel/StagePreview'
import TextButton from '../pixel/TextButton'
import useHelp from '../pixel/useHelp'
import usePopup from '../pixel/usePopup'
import { goBack, push, replace, stagePath, type StageListTab } from '../router'
import { useUIStore } from '../store'

const TOO_MANY_GROUPS = `At most ${MAX_BOT_GROUPS} bot groups are supported.`

const PER_PAGE = 6
const COLUMNS = 3
const GAP = 25
const LEN = 52 + GAP

/** 键盘焦点：顶部标签、关卡卡片（action 非空时在选卡片下方的操作按钮）、底部菜单 */
type Focus =
  | { area: 'tabs' }
  | { area: 'cards'; index: number; action: number | null }
  | { area: 'menu'; index: number }

interface CardAction {
  /** 按钮在卡片按钮行里的横坐标（半尺寸坐标系） */
  x: number
  content: string
  run: () => void
}

const EDIT_ICON_PIXELS: Array<[number, number]> = [
  [5, 0],
  [4, 1],
  [5, 1],
  [6, 1],
  [3, 2],
  [5, 2],
  [6, 2],
  [7, 2],
  [2, 3],
  [6, 3],
  [5, 4],
  [4, 5],
]

/** 铅笔图标按钮 */
function EditStageButton({
  x,
  y,
  focused,
  onClick,
}: {
  x: number
  y: number
  focused: boolean
  onClick: () => void
}) {
  const spreadX = 0.25 * B
  const spreadY = 0.125 * B
  const fill = '#ccc'
  return (
    <g className="text-button">
      <rect
        className={focused ? 'text-area focused' : 'text-area'}
        x={x - spreadX}
        y={y - spreadY}
        width={0.5 * B + 2 * spreadX}
        height={0.5 * B + 2 * spreadY}
        onClick={onClick}
      />
      <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
        {EDIT_ICON_PIXELS.map(([px, py]) => (
          <rect key={`${px},${py}`} x={px} y={py} width={1} height={1} fill={fill} />
        ))}
        <path d="M1,4 h1 v1 h1 v1 h1 v1 h-3 v-3" fill={fill} />
      </g>
    </g>
  )
}

function download(stage: RawStageConfig) {
  const { custom: _, ...json } = stage
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(json, null, 2)], { type: 'text/plain;charset=utf-8' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `stage-${stage.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** 关卡列表：default/custom 标签 + 预览网格 + 翻页 + 编辑/下载/上传 */
export default function StageList({ tab, page }: { tab: StageListTab; page: number }) {
  const customStages = useUIStore((s) => s.customStages)
  const deleteCustomStage = useUIStore((s) => s.deleteCustomStage)
  const addCustomStage = useUIStore((s) => s.addCustomStage)
  const setEditorContent = useUIStore((s) => s.setEditorContent)
  const { popup, open: popupOpen, showAlert, showConfirm } = usePopup()
  const help = useHelp(
    [
      [
        {
          title: 'stages',
          rows: [
            ['direction', 'move'],
            ['fire', 'select'],
            ['esc', 'back'],
          ],
        },
        {
          title: 'stage buttons',
          rows: [
            ['left/right', 'choose'],
            ['fire', 'ok'],
            ['esc', 'cancel'],
          ],
        },
      ],
    ],
    !popupOpen,
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const [focus, setFocus] = useState<Focus>({ area: 'cards', index: 0, action: null })

  const list: RawStageConfig[] = tab === 'default' ? builtinStages : customStages
  const maxPage = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const start = (page - 1) * PER_PAGE
  const pageStages = list.slice(start, start + PER_PAGE)

  const switchTab = (t: StageListTab) => replace(`/list/${t}/1`)
  const setPage = (p: number) => replace(`/list/${tab}/${p}`)
  const play = (stage: RawStageConfig, multi: boolean) =>
    push(stagePath('stage', stage.name, multi))

  const edit = async (stage: RawStageConfig) => {
    if (stage.bots.length > MAX_BOT_GROUPS) {
      await showAlert(TOO_MANY_GROUPS)
      return
    }
    setEditorContent(stage)
    push('/editor')
  }

  const remove = async (stage: RawStageConfig) => {
    if (await showConfirm(`Delete stage ${stage.name}?`)) {
      deleteCustomStage(stage.name)
    }
  }

  const upload = async (file: File) => {
    let stage: RawStageConfig
    try {
      const raw = JSON.parse(await file.text()) as RawStageConfig
      parseStage(raw)
      stage = { ...raw, name: String(raw.name), custom: true }
    } catch (error) {
      console.error(error)
      await showAlert('Failed to parse stage config file.')
      return
    }
    if (stage.bots.length > MAX_BOT_GROUPS) {
      await showAlert(TOO_MANY_GROUPS)
      return
    }
    if (builtinStages.some((s) => s.name === stage.name)) {
      await showAlert(`Stage ${stage.name} already exists.`)
      return
    }
    if (
      customStages.some((s) => s.name === stage.name) &&
      !(await showConfirm('Override existing custom stage. Continue?'))
    ) {
      return
    }
    addCustomStage(stage)
    if (tab !== 'custom') {
      replace('/list/custom/1')
    }
  }

  const cardActions = (stage: RawStageConfig): CardAction[] => [
    { x: 0, content: 'Ⅰ', run: () => play(stage, false) },
    { x: 1 * B, content: 'Ⅱ', run: () => play(stage, true) },
    { x: 2 * B, content: 'edit', run: () => edit(stage) },
    ...(tab === 'custom' ? [{ x: 5 * B, content: 'x', run: () => remove(stage) }] : []),
    { x: 6 * B, content: '↓', run: () => download(stage) },
  ]
  const menuItems = [
    { content: 'editor', x: 0, run: () => push('/editor') },
    { content: 'upload', x: 3.5 * B, run: () => inputRef.current?.click() },
    { content: 'back', x: 7 * B, run: goBack },
  ]

  // 翻页、删除后当前页的卡片数会变，焦点落到不存在的卡片时就近收拢
  const count = pageStages.length
  let current = focus
  if (current.area === 'cards' && count === 0) current = { area: 'menu', index: 0 }
  else if (current.area === 'cards' && current.index >= count) {
    current = { area: 'cards', index: count - 1, action: null }
  }
  const focusedStage = current.area === 'cards' ? pageStages[current.index] : null

  const firstCardOr = (fallback: Focus): Focus =>
    count > 0 ? { area: 'cards', index: 0, action: null } : fallback

  const onCardsKey = (key: MenuKey, index: number) => {
    const col = index % COLUMNS
    if (key === 'left') {
      if (col > 0) setFocus({ area: 'cards', index: index - 1, action: null })
      else if (page > 1) {
        setPage(page - 1)
        setFocus({ area: 'cards', index: index + COLUMNS - 1, action: null })
      }
    } else if (key === 'right') {
      if (col < COLUMNS - 1 && index + 1 < count) {
        setFocus({ area: 'cards', index: index + 1, action: null })
      } else if (page < maxPage) {
        setPage(page + 1)
        setFocus({ area: 'cards', index: index - col, action: null })
      }
    } else if (key === 'up') {
      setFocus(
        index >= COLUMNS
          ? { area: 'cards', index: index - COLUMNS, action: null }
          : { area: 'tabs' },
      )
    } else if (key === 'down') {
      setFocus(
        index + COLUMNS < count
          ? { area: 'cards', index: index + COLUMNS, action: null }
          : { area: 'menu', index: 0 },
      )
    } else if (key === 'confirm') {
      setFocus({ area: 'cards', index, action: 0 })
    } else {
      goBack()
    }
  }

  const onActionKey = (key: MenuKey, index: number, action: number) => {
    const actions = cardActions(pageStages[index])
    if (key === 'left' || key === 'right') {
      const delta = key === 'left' ? -1 : 1
      const next = (action + delta + actions.length) % actions.length
      setFocus({ area: 'cards', index, action: next })
    } else if (key === 'confirm') {
      actions[action].run()
    } else {
      setFocus({ area: 'cards', index, action: null })
    }
  }

  useMenuKeys((key) => {
    if (current.area === 'tabs') {
      if (key === 'left' || key === 'right') switchTab(tab === 'default' ? 'custom' : 'default')
      else if (key === 'down' || key === 'confirm')
        setFocus(firstCardOr({ area: 'menu', index: 0 }))
      else if (key === 'back') goBack()
    } else if (current.area === 'menu') {
      const index = current.index
      if (key === 'left') setFocus({ area: 'menu', index: Math.max(0, index - 1) })
      else if (key === 'right') {
        setFocus({ area: 'menu', index: Math.min(menuItems.length - 1, index + 1) })
      } else if (key === 'up') {
        setFocus(
          count > COLUMNS
            ? { area: 'cards', index: COLUMNS, action: null }
            : firstCardOr({ area: 'tabs' }),
        )
      } else if (key === 'confirm') menuItems[index].run()
      else if (key === 'back') goBack()
    } else if (current.action == null) {
      onCardsKey(key, current.index)
    } else {
      onActionKey(key, current.index, current.action)
    }
  }, !popupOpen)

  return (
    <>
      <Screen background="#333">
        <PixelText content="stages" x={0.5 * B} y={0.5 * B} />
        <TextButton
          content="default"
          x={4.5 * B}
          y={0.5 * B}
          selected={tab === 'default'}
          onClick={tab !== 'default' ? () => switchTab('default') : undefined}
        />
        <TextButton
          content="custom"
          x={8.5 * B}
          y={0.5 * B}
          selected={tab === 'custom'}
          onClick={tab !== 'custom' ? () => switchTab('custom') : undefined}
        />
        {current.area === 'tabs' && (
          <FocusFrame
            x={4.25 * B - 2}
            y={0.375 * B - 2}
            width={7.5 * B + 4}
            height={0.75 * B + 4}
          />
        )}

        {pageStages.length === 0 && (
          <PixelText x={0.5 * B} y={3 * B} content="No custom stage." fill="#666666" />
        )}

        <g transform="translate(0, 40)">
          {pageStages.map((stage, i) => {
            const x = GAP + (i % COLUMNS) * LEN
            const y = 70 * Math.floor(i / COLUMNS)
            const focusedAction =
              stage === focusedStage && current.area === 'cards' ? current.action : null
            return (
              <g key={stage.name} transform={`translate(${x}, ${y})`}>
                <StagePreview stage={stage} scale={0.25} />
                <g transform="scale(0.5)">
                  <PixelText content={stage.name} fill="#dd2664" />
                </g>
                {stage === focusedStage && <FocusFrame x={-2} y={-2} width={56} height={56} />}
                <g transform="translate(0, 56) scale(0.5)">
                  {cardActions(stage).map((action, a) =>
                    action.content === 'edit' ? (
                      <EditStageButton
                        key={action.content}
                        x={action.x}
                        y={0}
                        focused={focusedAction === a}
                        onClick={action.run}
                      />
                    ) : (
                      <TextButton
                        key={action.content}
                        x={action.x}
                        y={0}
                        content={action.content}
                        focused={focusedAction === a}
                        onClick={action.run}
                      />
                    ),
                  )}
                </g>
              </g>
            )
          })}
        </g>

        <g transform={`translate(${6.5 * B}, 0)`}>
          <TextButton
            x={0}
            y={12 * B}
            content={'←'}
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          />
          <PixelText x={1.25 * B} y={12 * B} content={String(page)} />
          <TextButton
            x={2.5 * B}
            y={12 * B}
            content={'→'}
            onClick={() => setPage(page + 1)}
            disabled={page >= maxPage}
          />
        </g>

        <g transform={`translate(${5.5 * B}, ${13.5 * B})`}>
          {menuItems.map((item, i) => (
            <TextButton
              key={item.content}
              content={item.content}
              x={item.x}
              y={0}
              focused={current.area === 'menu' && current.index === i}
              onClick={item.run}
            />
          ))}
        </g>
        {help.button}
        {popup}
        {help.overlay}
      </Screen>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          // 清空选择，重复上传同一文件也能触发 change
          e.target.value = ''
          if (file != null) void upload(file)
        }}
      />
    </>
  )
}
