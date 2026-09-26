import { useState } from 'react'
import type { PlayerControl } from '../input/bindings'
import { directionLabel, keyLabel } from './keyLabels'
import { useMenuKeys } from './menuKeys'
import PixelText from './pixel/PixelText'
import TextButton from './pixel/TextButton'

export type PauseAction = 'resume' | 'restart' | 'stage-select' | 'title'

const ITEMS: { action: PauseAction; label: string }[] = [
  { action: 'resume', label: 'resume' },
  { action: 'restart', label: 'restart stage' },
  { action: 'stage-select', label: 'stage select' },
  { action: 'title', label: 'title' },
]

const BOX_X = 32
const BOX_Y = 48
const BOX_WIDTH = 192
const ITEM_Y = 76
const LINE_HEIGHT = 12
const PLAYER_NAMES = ['Ⅰ', 'Ⅱ']

/** 以战场中线（x = 120）居中放置一行文字 */
function centerX(text: string): number {
  return 120 - text.length * 4
}

export interface PauseMenuProps {
  /** 本局各玩家的键位 */
  controls: PlayerControl[]
  onSelect: (action: PauseAction) => void
}

/**
 * 战场中央的暂停菜单：上下选择、确认键执行，也可以用鼠标；
 * 下方列出各玩家的键位。Esc 恢复由 GameCanvas 处理。
 */
export default function PauseMenu({ controls, onSelect }: PauseMenuProps) {
  const [index, setIndex] = useState(0)

  useMenuKeys((key) => {
    if (key === 'down') setIndex((index + 1) % ITEMS.length)
    else if (key === 'up') setIndex((index - 1 + ITEMS.length) % ITEMS.length)
    else if (key === 'confirm') onSelect(ITEMS[index].action)
  })

  const controlsY = ITEM_Y + ITEMS.length * LINE_HEIGHT + 8
  const hintY = controlsY + controls.length * LINE_HEIGHT + 4
  const boxHeight = hintY + 8 + 8 - BOX_Y
  const hint = 'esc resume'

  return (
    <g className="pause-menu" style={{ pointerEvents: 'auto' }}>
      <rect
        x={BOX_X + 0.5}
        y={BOX_Y + 0.5}
        width={BOX_WIDTH - 1}
        height={boxHeight - 1}
        fill="#000000"
        stroke="#ffffff"
      />
      <PixelText x={centerX('pause')} y={BOX_Y + 8} content="pause" fill="#db2b00" />
      {ITEMS.map((item, i) => (
        <TextButton
          key={item.action}
          x={64}
          y={ITEM_Y + i * LINE_HEIGHT}
          content={item.label}
          textFill="white"
          onMouseOver={() => setIndex(i)}
          onClick={() => onSelect(item.action)}
        />
      ))}
      <PixelText x={52} y={ITEM_Y + index * LINE_HEIGHT} content="→" />
      {controls.map((control, i) => {
        const line = `${PLAYER_NAMES[i]} move ${directionLabel(control)} fire ${keyLabel(control.fire)}`
        return (
          <PixelText
            key={i}
            x={centerX(line)}
            y={controlsY + i * LINE_HEIGHT}
            content={line}
            fill="#999999"
          />
        )
      })}
      <PixelText x={centerX(hint)} y={hintY} content={hint} fill="#999999" />
    </g>
  )
}
