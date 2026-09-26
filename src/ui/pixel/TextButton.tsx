import { BLOCK_SIZE as B } from '../../engine/constants'
import PixelText from './PixelText'
import './pixel.css'

interface TextButtonProps {
  x?: number
  y?: number
  content: string
  spreadX?: number
  spreadY?: number
  onClick?: () => void
  onMouseOver?: () => void
  selected?: boolean
  /** 键盘焦点，样式同鼠标悬停 */
  focused?: boolean
  textFill?: string
  selectedTextFill?: string
  disabled?: boolean
  stroke?: string
}

/**
 * 可点击的像素文本按钮。移植自旧项目 app/components/TextButton.tsx。
 * 命中区域为文本外扩 spreadX/spreadY 的矩形。
 */
export default function TextButton({
  x = 0,
  y = 0,
  content,
  spreadX = 0.25 * B,
  spreadY = 0.125 * B,
  onClick,
  onMouseOver,
  selected,
  focused,
  textFill = '#ccc',
  selectedTextFill = '#333',
  disabled = false,
  stroke = 'none',
}: TextButtonProps) {
  const areaClass = `text-area${selected ? ' selected' : ''}${focused ? ' focused' : ''}${disabled ? ' disabled' : ''}`
  return (
    <g className="text-button">
      <rect
        className={areaClass}
        x={x - spreadX}
        y={y - spreadY}
        width={content.length * 0.5 * B + 2 * spreadX}
        height={0.5 * B + 2 * spreadY}
        onClick={disabled ? undefined : onClick}
        onMouseOver={onMouseOver}
        stroke={stroke}
        strokeDasharray="2"
      />
      <PixelText
        style={{ pointerEvents: 'none', opacity: disabled ? 0.3 : 1 }}
        x={x}
        y={y}
        content={content}
        fill={selected ? selectedTextFill : textFill}
      />
    </g>
  )
}
