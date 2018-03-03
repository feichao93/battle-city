import React from 'react'
import classNames from 'classnames'
import { BLOCK_SIZE as B } from 'utils/constants'
import Text from 'components/Text'

type TextButtonProps = {
  x: number
  y: number
  content: string
  spreadX?: number
  spreadY?: number
  onClick?: () => void
  onMouseOver?: () => void
  selected?: boolean
  textFill?: string
  selectedTextFill?: string
  disabled?: boolean
}

const TextButton = ({
  x,
  y,
  content,
  spreadX = 0.25 * B,
  spreadY = 0.125 * B,
  onClick,
  onMouseOver,
  selected,
  textFill = '#ccc',
  selectedTextFill = '#333',
  disabled = false,
}: TextButtonProps) => {
  return (
    <g role="text-button">
      <rect
        className={classNames('text-area', { selected, disabled })}
        x={x - spreadX}
        y={y - spreadY}
        width={content.length * 0.5 * B + 2 * spreadX}
        height={0.5 * B + 2 * spreadY}
        onClick={disabled ? null : onClick}
        onMouseOver={onMouseOver}
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
