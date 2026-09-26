import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BLOCK_SIZE as B } from '../../engine/constants'
import { OverlayFrame, useOverlayKeys } from './Overlay'
import PixelText, { textWidth } from './PixelText'
import TextButton from './TextButton'

/** 一组按键说明，每行是 [按键, 作用] */
export interface HelpSection {
  title?: string
  rows: Array<[keys: string, action: string]>
}

export interface HelpHandle {
  /** 右下角的 ? 按钮 */
  button: ReactNode
  /** 渲染在 Screen 最上层的说明浮层 */
  overlay: ReactNode
  show(): void
}

const LINE_HEIGHT = 12
const SECTION_GAP = 4
const COLUMN_GAP = 16

function sectionHeight(section: HelpSection): number {
  return (section.rows.length + (section.title == null ? 0 : 1)) * LINE_HEIGHT
}

function columnLayout(sections: HelpSection[]) {
  const keyWidth = Math.max(...sections.flatMap((s) => s.rows.map(([keys]) => textWidth(keys))))
  const width = Math.max(
    ...sections.flatMap((s) => [
      textWidth(s.title ?? ''),
      ...s.rows.map(([, action]) => keyWidth + 8 + textWidth(action)),
    ]),
  )
  const height =
    sections.reduce((sum, s) => sum + sectionHeight(s), 0) + (sections.length - 1) * SECTION_GAP
  return { sections, keyWidth, width, height }
}

/**
 * 页面的按键说明：平时只在右下角显示 ?，按 ?（shift+/）或点它打开浮层，再按 ?、esc、确认键或点击关闭。
 * columns 是并排的几列，每列从上往下排若干组说明。
 * enabled 为 false 时（录键、输入文字、弹窗打开）不响应 ?
 */
export default function useHelp(columns: HelpSection[][], enabled = true): HelpHandle {
  const [open, setOpen] = useState(false)
  const stateRef = useRef({ open, enabled })
  stateRef.current = { open, enabled }
  useOverlayKeys(open, () => setOpen(false))

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { open, enabled } = stateRef.current
      if (!open && enabled && !e.defaultPrevented && e.key === '?') {
        // 默认键位里 / 是 Ⅱ 的开火键，放过去会被页面当成确认
        e.stopPropagation()
        if (!e.repeat) setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const button = (
    <TextButton
      content="?"
      x={15 * B}
      y={14.25 * B}
      spreadX={0.05 * B}
      spreadY={0.05 * B}
      onClick={() => setOpen(true)}
    />
  )

  let overlay: ReactNode = null
  if (open) {
    const layouts = columns.map(columnLayout)
    const contentWidth =
      layouts.reduce((sum, c) => sum + c.width, 0) + (layouts.length - 1) * COLUMN_GAP
    const contentHeight = Math.max(...layouts.map((c) => c.height))

    let columnX = 0
    const columnNodes = layouts.map((column, c) => {
      const x = columnX
      columnX += column.width + COLUMN_GAP
      let y = 0
      return column.sections.map((section, s) => {
        const top = y
        y += sectionHeight(section) + SECTION_GAP
        const rowsY = section.title == null ? top : top + LINE_HEIGHT
        return (
          <g key={`${c}-${s}`}>
            {section.title != null && (
              <PixelText x={x} y={top} content={section.title} fill="#9ed046" />
            )}
            {section.rows.map(([keys, action], r) => (
              <g key={r}>
                <PixelText x={x} y={rowsY + r * LINE_HEIGHT} content={keys} />
                <PixelText
                  x={x + column.keyWidth + 8}
                  y={rowsY + r * LINE_HEIGHT}
                  content={action}
                  fill="#999999"
                />
              </g>
            ))}
          </g>
        )
      })
    })

    overlay = (
      <OverlayFrame
        title="help"
        width={contentWidth}
        height={contentHeight}
        onClose={() => setOpen(false)}
      >
        {columnNodes}
      </OverlayFrame>
    )
  }

  return { button, overlay, show: () => setOpen(true) }
}
