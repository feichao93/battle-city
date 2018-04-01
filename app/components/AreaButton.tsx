import React from 'react'

interface AreaButtonProps {
  x?: number
  y?: number
  width: number
  height: number
  onClick?: () => void
  strokeWidth?: number
  spreadX?: number
  spreadY?: number
}

export default ({
  x = 0,
  y = 0,
  width,
  height,
  onClick,
  strokeWidth = 1,
  spreadX = 2,
  spreadY = 1,
}: AreaButtonProps) => {
  return (
    <rect
      className="area-button"
      x={x - spreadX}
      y={y - spreadY}
      width={width + 2 * spreadX}
      height={height + 2 * spreadY}
      onClick={onClick}
      stroke="transparent"
      strokeWidth={strokeWidth}
    />
  )
}
