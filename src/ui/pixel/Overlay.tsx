import { useEffect, useRef, type ReactNode } from 'react'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../engine/constants'
import { menuKeyOf } from '../menuKeys'
import { useUIStore } from '../store'
import PixelText, { textWidth } from './PixelText'

const PADDING = 12
const FOOTER = 'esc close'

/**
 * 浮层打开时拦下所有按键，按 ?、esc 或确认键关闭。
 * 捕获阶段先于页面的所有按键监听，拦下的按键页面收不到
 */
export function useOverlayKeys(open: boolean, close: () => void): void {
  const bindings = useUIStore((s) => s.bindings)
  const stateRef = useRef({ open, close })
  stateRef.current = { open, close }
  useEffect(() => {
    const controls = [bindings.p1, bindings.p2]
    const onKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current.open) return
      e.stopPropagation()
      const key = menuKeyOf(e.code, controls)
      if (!e.repeat && (e.key === '?' || key === 'back' || key === 'confirm')) {
        // 真实按键在两个监听器之间会跑微任务，React 已按关闭后的状态重渲染；
        // 标记一下，免得同一次按键又被 ? 的打开监听器当成「打开」
        e.preventDefault()
        stateRef.current.close()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [bindings])
}

/**
 * 居中的黑底白框浮层：红色标题、内容、底部「esc close」，点哪里都关闭。
 * children 以内容区左上角为原点，内容区大小为 width × height
 */
export function OverlayFrame({
  title,
  width,
  height,
  onClose,
  children,
}: {
  title: string
  width: number
  height: number
  onClose: () => void
  children: ReactNode
}) {
  const boxWidth = Math.max(width, textWidth(FOOTER)) + 2 * PADDING
  const boxHeight = 8 + 20 + height + 8 + 8 + 8
  const boxX = Math.round((SCREEN_WIDTH - boxWidth) / 2)
  const boxY = Math.round((SCREEN_HEIGHT - boxHeight) / 2)
  const centerX = (text: string) => SCREEN_WIDTH / 2 - textWidth(text) / 2
  return (
    <g className="overlay" onClick={onClose}>
      {/* 透明遮罩挡住下层按钮 */}
      <rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="transparent" />
      <rect
        x={boxX + 0.5}
        y={boxY + 0.5}
        width={boxWidth - 1}
        height={boxHeight - 1}
        fill="#000000"
        stroke="#ffffff"
      />
      <PixelText x={centerX(title)} y={boxY + 8} content={title} fill="#db2b00" />
      <g transform={`translate(${boxX + (boxWidth - width) / 2}, ${boxY + 28})`}>{children}</g>
      <PixelText x={centerX(FOOTER)} y={boxY + boxHeight - 16} content={FOOTER} fill="#999999" />
    </g>
  )
}
