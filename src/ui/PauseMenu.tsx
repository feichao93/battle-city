import { useState } from 'react'
import type { PlayerControl } from '../input/bindings'
import { directionLabel, keyLabel } from './keyLabels'
import { useMenuKeys } from './menuKeys'
import PixelText from './pixel/PixelText'
import TextButton from './pixel/TextButton'

export interface PauseItem {
  label: string
  onSelect: () => void
}

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

function PauseBox({ height }: { height: number }) {
  return (
    <>
      <rect
        x={BOX_X + 0.5}
        y={BOX_Y + 0.5}
        width={BOX_WIDTH - 1}
        height={height - 1}
        fill="#000000"
        stroke="#ffffff"
      />
      <PixelText x={centerX('pause')} y={BOX_Y + 8} content="pause" fill="#db2b00" />
    </>
  )
}

export interface PauseMenuProps {
  items: PauseItem[]
  /** 本机玩家的键位 */
  controls: PlayerControl[]
  /** controls[0] 的玩家下标；联机客机是 2P，传 1 */
  firstPlayer?: number
}

/**
 * 战场中央的暂停菜单：上下选择、确认键执行，也可以用鼠标；
 * 下方列出各玩家的键位。Esc 恢复由调用方处理。
 */
export default function PauseMenu({ items, controls, firstPlayer = 0 }: PauseMenuProps) {
  const [index, setIndex] = useState(0)

  useMenuKeys((key) => {
    if (key === 'down') setIndex((index + 1) % items.length)
    else if (key === 'up') setIndex((index - 1 + items.length) % items.length)
    else if (key === 'confirm') items[index].onSelect()
  })

  const controlsY = ITEM_Y + items.length * LINE_HEIGHT + 8
  const hintY = controlsY + controls.length * LINE_HEIGHT + 4
  const hint = 'esc resume'

  return (
    <g className="pause-menu" style={{ pointerEvents: 'auto' }}>
      <PauseBox height={hintY + 8 + 8 - BOX_Y} />
      {items.map((item, i) => (
        <TextButton
          key={item.label}
          x={64}
          y={ITEM_Y + i * LINE_HEIGHT}
          content={item.label}
          textFill="white"
          onMouseOver={() => setIndex(i)}
          onClick={item.onSelect}
        />
      ))}
      <PixelText x={52} y={ITEM_Y + index * LINE_HEIGHT} content="→" />
      {controls.map((control, i) => {
        const line = `${PLAYER_NAMES[firstPlayer + i]} move ${directionLabel(control)} fire ${keyLabel(control.fire)}`
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

/** 联机时对方暂停了：本机只能等，没有菜单 */
export function PauseNotice({ text }: { text: string }) {
  return (
    <g>
      <PauseBox height={ITEM_Y + 8 + 8 - BOX_Y} />
      <PixelText x={centerX(text)} y={ITEM_Y} content={text} fill="#999999" />
    </g>
  )
}
