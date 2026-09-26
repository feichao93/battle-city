import { useEffect, useState } from 'react'
import { BLOCK_SIZE as B } from '../../engine/constants'
import type { PlayerControl } from '../../input/bindings'
import { keyLabel } from '../keyLabels'
import { useMenuKeys } from '../menuKeys'
import HintText from '../pixel/HintText'
import PixelText from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import TextButton from '../pixel/TextButton'
import useHelp from '../pixel/useHelp'
import { replace } from '../router'
import { useUIStore, type ControlAction } from '../store'

type PlayerId = 'p1' | 'p2'

const ACTIONS: ControlAction[] = ['up', 'down', 'left', 'right', 'fire']
const PLAYERS: PlayerId[] = ['p1', 'p2']
const PLAYER_LABELS = ['Ⅰp', 'Ⅱp']
/** 键位表下方依次是托管开关和两个菜单项，光标行号接在动作之后 */
const AUTOPILOT_ROW = ACTIONS.length
const RESET_ROW = ACTIONS.length + 1
const BACK_ROW = ACTIONS.length + 2

const LABEL_X = 2 * B
const COLUMN_X = [7 * B, 11 * B]
const HEADER_Y = 3 * B
const ROW_Y = 4.5 * B
const ROW_HEIGHT = 1.25 * B
const AUTOPILOT_Y = 10.75 * B
/** autopilot 这个标签比动作名长，值往右挪半格，给光标留出位置 */
const SETTING_X = 7.5 * B
const MENU_Y = [12 * B, 13 * B]
const CONFLICT_FILL = '#db2b00'

/** 被绑定了不止一次的键码 */
function conflictedCodes(bindings: Record<PlayerId, PlayerControl>): Set<string> {
  const seen = new Set<string>()
  const conflicted = new Set<string>()
  for (const player of PLAYERS) {
    for (const action of ACTIONS) {
      const code = bindings[player][action]
      if (seen.has(code)) conflicted.add(code)
      seen.add(code)
    }
  }
  return conflicted
}

/** 键位设置：光标选中某个键位后按开火键（或点击）进入录键，下一次按键即为新键位 */
export default function Options() {
  const bindings = useUIStore((s) => s.bindings)
  const setBinding = useUIStore((s) => s.setBinding)
  const resetBindings = useUIStore((s) => s.resetBindings)
  const autopilot = useUIStore((s) => s.autopilot)
  const setAutopilot = useUIStore((s) => s.setAutopilot)
  const [row, setRow] = useState(0)
  const [col, setCol] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const help = useHelp(
    [
      [
        {
          rows: [
            ['direction', 'move'],
            ['fire/enter', 'change'],
            ['esc', 'back'],
          ],
        },
      ],
    ],
    !capturing,
  )

  const confirm = (targetRow: number) => {
    if (targetRow === AUTOPILOT_ROW) setAutopilot(!autopilot)
    else if (targetRow === RESET_ROW) resetBindings()
    else if (targetRow === BACK_ROW) replace('/')
    else setCapturing(true)
  }

  useMenuKeys((key) => {
    if (key === 'back') replace('/')
    else if (key === 'up') setRow((row - 1 + BACK_ROW + 1) % (BACK_ROW + 1))
    else if (key === 'down') setRow((row + 1) % (BACK_ROW + 1))
    else if ((key === 'left' || key === 'right') && row === AUTOPILOT_ROW) setAutopilot(!autopilot)
    else if (key === 'left' || key === 'right') setCol(1 - col)
    else confirm(row)
  }, !capturing)

  // 录键时下一次按键原样作为新键位，不经过导航语义
  useEffect(() => {
    if (!capturing) return
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      if (e.code !== 'Escape') setBinding(PLAYERS[col], ACTIONS[row], e.code)
      setCapturing(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  const conflicted = conflictedCodes(bindings)
  let cursorX = LABEL_X - 12
  let cursorY = row >= RESET_ROW ? MENU_Y[row - RESET_ROW] : AUTOPILOT_Y
  if (row < AUTOPILOT_ROW) {
    cursorX = COLUMN_X[col] - 12
    cursorY = ROW_Y + row * ROW_HEIGHT
  } else if (row === AUTOPILOT_ROW) {
    cursorX = SETTING_X - 12
  }

  // 按键说明收在 ? 里，这里只留状态提示
  let hint: string | null = null
  if (row === AUTOPILOT_ROW) {
    hint = 'cpu drives players who stay idle'
  } else if (capturing) {
    hint = `press new key for ${PLAYER_LABELS[col]} ${ACTIONS[row]}  esc cancel`
  }

  return (
    <Screen background="#333">
      <PixelText content="options" x={0.5 * B} y={0.5 * B} />
      {PLAYER_LABELS.map((label, i) => (
        <PixelText key={label} content={label} x={COLUMN_X[i]} y={HEADER_Y} fill="#999999" />
      ))}
      {ACTIONS.map((action, r) => (
        <g key={action}>
          <PixelText content={action} x={LABEL_X} y={ROW_Y + r * ROW_HEIGHT} />
          {PLAYERS.map((player, c) => {
            const code = bindings[player][action]
            const editing = capturing && row === r && col === c
            return (
              <TextButton
                key={player}
                content={editing ? '?' : keyLabel(code)}
                x={COLUMN_X[c]}
                y={ROW_Y + r * ROW_HEIGHT}
                textFill={editing ? '#9ed046' : conflicted.has(code) ? CONFLICT_FILL : 'white'}
                onMouseOver={() => {
                  if (capturing) return
                  setRow(r)
                  setCol(c)
                }}
                onClick={() => {
                  setRow(r)
                  setCol(c)
                  setCapturing(true)
                }}
              />
            )
          })}
        </g>
      ))}
      <PixelText content="autopilot" x={LABEL_X} y={AUTOPILOT_Y} />
      <TextButton
        content={autopilot ? 'on' : 'off'}
        x={SETTING_X}
        y={AUTOPILOT_Y}
        textFill="white"
        onMouseOver={() => !capturing && setRow(AUTOPILOT_ROW)}
        onClick={() => confirm(AUTOPILOT_ROW)}
      />
      {['reset', 'back'].map((label, i) => (
        <TextButton
          key={label}
          content={label}
          x={LABEL_X}
          y={MENU_Y[i]}
          textFill="white"
          onMouseOver={() => !capturing && setRow(RESET_ROW + i)}
          onClick={() => confirm(RESET_ROW + i)}
        />
      ))}
      <PixelText content="→" x={cursorX} y={cursorY} />
      {conflicted.size > 0 && (
        <HintText
          content="red keys are bound more than once"
          x={COLUMN_X[0]}
          y={MENU_Y[0] + 0.125 * B}
          fill={CONFLICT_FILL}
        />
      )}
      {hint != null && <HintText content={hint} />}
      {help.button}
      {help.overlay}
    </Screen>
  )
}
