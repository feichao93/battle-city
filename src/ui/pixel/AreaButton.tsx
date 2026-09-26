import './pixel.css'

interface AreaButtonProps {
  x?: number
  y?: number
  width: number
  height: number
  onClick?: () => void
  spreadX?: number
  spreadY?: number
}

/** 透明矩形热区按钮，悬停时描边。移植自原版 AreaButton */
export default function AreaButton({
  x = 0,
  y = 0,
  width,
  height,
  onClick,
  spreadX = 2,
  spreadY = 1,
}: AreaButtonProps) {
  return (
    <rect
      className="area-button"
      x={x - spreadX}
      y={y - spreadY}
      width={width + 2 * spreadX}
      height={height + 2 * spreadY}
      onClick={onClick}
      stroke="transparent"
    />
  )
}
