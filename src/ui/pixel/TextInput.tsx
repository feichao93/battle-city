import { useState, type Ref } from 'react'
import { BLOCK_SIZE as B } from '../../engine/constants'
import PixelText, { supportsChar } from './PixelText'

interface TextInputProps {
  x: number
  y: number
  maxLength: number
  value: string
  onChange: (value: string) => void
  /** 键盘操作时由页面调用 focus() 进入输入 */
  ref?: Ref<SVGGElement>
  onFocusChange?: (focused: boolean) => void
}

/** 像素文本输入框：聚焦后直接接收按键，只接受像素字体支持的字符。移植自原版 TextInput */
export default function TextInput({
  x,
  y,
  maxLength,
  value,
  onChange,
  ref,
  onFocusChange,
}: TextInputProps) {
  const [focused, setFocused] = useState(false)
  const changeFocus = (next: boolean) => {
    setFocused(next)
    onFocusChange?.(next)
  }
  return (
    <g
      ref={ref}
      tabIndex={1}
      onFocus={() => changeFocus(true)}
      onBlur={() => changeFocus(false)}
      onKeyDown={(event) => {
        // 输入期间的按键（包括方向键、数字）都属于输入框，不交给页面的导航与快捷键
        event.stopPropagation()
        if (event.key === 'Enter' || event.key === 'Escape') {
          event.currentTarget.blur()
        } else if (event.key === 'Backspace') {
          onChange(value.slice(0, -1))
        } else if (supportsChar(event.key)) {
          onChange((value + event.key).slice(0, maxLength))
        }
      }}
      style={{ outline: 'none' }}
    >
      <rect
        x={x - 2}
        y={y - 2}
        height={0.5 * B + 4}
        width={maxLength * 0.5 * B + 4}
        fill="transparent"
        stroke="#e91e63"
        strokeOpacity="0.2"
      />
      <PixelText x={x} y={y} content={value} fill="#ccc" />
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
