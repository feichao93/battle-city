import { ITEM_SIZE_MAP } from '../../engine/constants'
import { brickShape } from '../../render/sprites/terrain'

/** 单块 4×4 砖。移植自 app/components/BrickWall.tsx。 */
export default function BrickWall({ x, y }: { x: number; y: number }) {
  const shape = brickShape(Math.floor(y / ITEM_SIZE_MAP.BRICK), Math.floor(x / ITEM_SIZE_MAP.BRICK))
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={4} height={4} fill="#636363" />
      <rect x={shape ? 0 : 1} y={0} width={shape ? 4 : 3} height={3} fill="#6B0800" />
      <rect x={shape ? 0 : 2} y={1} width={shape ? 4 : 2} height={2} fill="#9C4A00" />
    </g>
  )
}

/** 砖纹 pattern 的填充引用；pattern 按文字的放大倍数区分，同一 SVG 里可以并存多种倍数 */
export function brickPatternFill(scale: number): string {
  return `url(#pattern-brickwall-${scale})`
}

/** 大标题用的砖纹 pattern 定义，用于 Title 的 BATTLE CITY、结束页的 GAME OVER 等文本填充 */
export function BrickPatternDef({ scale = 4 }: { scale?: number }) {
  const size = ITEM_SIZE_MAP.BRICK
  return (
    <defs>
      <pattern
        id={`pattern-brickwall-${scale}`}
        width={(size * 2) / scale}
        height={(size * 2) / scale}
        patternUnits="userSpaceOnUse"
      >
        <g transform={`scale(${1 / scale})`}>
          <BrickWall x={0} y={0} />
          <BrickWall x={0} y={size} />
          <BrickWall x={size} y={0} />
          <BrickWall x={size} y={size} />
        </g>
      </pattern>
    </defs>
  )
}
