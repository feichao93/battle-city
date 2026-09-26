import {
  BLOCK_SIZE as B,
  FIELD_BLOCK_SIZE as FBZ,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from '../../engine/constants'

const LINES = Array.from({ length: FBZ }, (_, i) => i + 1)

/** 编辑器虚线网格；t 为鼠标所在 block，其四周的线高亮 */
export default function Grid({ t = -1 }: { t?: number }) {
  const hrow = t === -1 ? -1 : Math.floor(t / FBZ)
  const hcol = t === -1 ? -1 : t % FBZ
  const near = (h: number, line: number) => h === line || h === line - 1
  return (
    <g className="dash-lines" stroke="steelblue" strokeWidth="0.5" strokeDasharray="2 2">
      {LINES.map((col) => (
        <line
          key={`c${col}`}
          x1={B * col}
          y1={0}
          x2={B * col}
          y2={SCREEN_HEIGHT}
          strokeOpacity={near(hcol, col) ? 1 : 0.3}
        />
      ))}
      {LINES.map((row) => (
        <line
          key={`r${row}`}
          x1={0}
          y1={B * row}
          x2={SCREEN_WIDTH}
          y2={B * row}
          strokeOpacity={near(hrow, row) ? 1 : 0.3}
        />
      ))}
    </g>
  )
}
