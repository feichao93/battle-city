import classNames from 'classnames'
import React from 'react'
import { BLOCK_SIZE as B } from '../utils/constants'
import Text from './Text'

type TextButtonProps = {
  x?: number
  y?: number
  content: string
  spreadX?: number
  spreadY?: number
  onClick?: () => void
  onMouseOver?: () => void
  selected?: boolean
  textFill?: string
  selectedTextFill?: string
  disabled?: boolean
  stroke?: string
}

const TextButton = ({
  x = 0,
  y = 0,
  content,
  spreadX = 0.25 * B,
  spreadY = 0.125 * B,
  onClick,
  onMouseOver,
  selected,
  textFill = '#ccc',
  selectedTextFill = '#333',
  disabled = false,
  stroke = 'none',
}: TextButtonProps) => {
  return (
    <g className="text-button">
      <rect
        className={classNames('text-area', { selected, disabled })}
        x={x - spreadX}
        y={y - spreadY}
        width={content.length * 0.5 * B + 2 * spreadX}
        height={0.5 * B + 2 * spreadY}
        onClick={disabled ? null : onClick}
        onMouseOver={onMouseOver}
        stroke={stroke}
        strokeDasharray="2"
      />
      <Text
        style={{ pointerEvents: 'none', opacity: disabled ? 0.3 : 1 }}
        x={x}
        y={y}
        content={content}
        fill={selected ? selectedTextFill : textFill}
      />
    </g>
  )
}

export default TextButton
