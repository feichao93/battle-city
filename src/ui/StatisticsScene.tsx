import {
  BLOCK_SIZE as B,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  TANK_KILL_SCORE_MAP,
  TANK_LEVELS,
  ZOOM_LEVEL,
} from '../engine/constants'
import type { StatisticsView } from '../engine/StatisticsAnimation'
import type { TankLevel } from '../engine/types'
import PixelText from './pixel/PixelText'
import TankSvg from './pixel/TankSvg'

/** 各等级所在行的 y（旧版 StatisticsScene） */
const ROW_Y: Record<TankLevel, number> = { basic: 8, fast: 9.5, power: 11, armor: 12.5 }

/** 关卡结算页，覆盖在战场画布之上 */
export default function StatisticsScene({
  view,
  scores,
}: {
  view: StatisticsView
  scores: number[]
}) {
  return (
    <svg
      width={SCREEN_WIDTH * ZOOM_LEVEL}
      height={SCREEN_HEIGHT * ZOOM_LEVEL}
      viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
      style={{ position: 'absolute', top: 0, left: 0, imageRendering: 'pixelated' }}
    >
      <StatisticsContent view={view} scores={scores} />
    </svg>
  )
}

/** 结算页内容，布局移植自旧版 app/components/StatisticsScene.tsx；画廊的 statistics 页复用 */
export function StatisticsContent({ view, scores }: { view: StatisticsView; scores: number[] }) {
  const [p1, p2] = view.counts
  return (
    <g className="statistics-scene">
      <rect fill="#000000" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />
      <g transform={`translate(${-0.5 * B}, ${-1.5 * B})`}>
        <PixelText content="HI-SCORE" x={4.5 * B} y={3.5 * B} fill="#e44437" />
        <PixelText content="20000" x={10 * B} y={3.5 * B} fill="#feac4e" />
        <PixelText content={`STAGE  ${view.stageName}`} x={6.5 * B} y={4.5 * B} fill="#ffffff" />

        {/* 中间的 4 辆坦克 & 白线 */}
        {TANK_LEVELS.map((level) => (
          <TankSvg
            key={level}
            x={8 * B}
            y={(ROW_Y[level] - 0.3) * B}
            side="bot"
            level={level}
            color="silver"
          />
        ))}
        <rect x={6.5 * B} y={13.3 * B} width={4 * B} height={2} fill="white" />

        <PixelText content={'Ⅰ-PLAYER'} x={2 * B} y={5.5 * B} fill="#e44437" />
        <PixelText content={String(scores[0]).padStart(8)} x={2 * B} y={6.5 * B} fill="#feac4e" />
        {TANK_LEVELS.map((level) => {
          const n = p1[level]
          const count = n === -1 ? '  ' : String(n).padStart(2)
          const points = n === -1 ? '    ' : String(n * TANK_KILL_SCORE_MAP[level]).padStart(4)
          return (
            <PixelText
              key={level}
              content={`${points} PTS ${count}←`}
              x={2 * B}
              y={ROW_Y[level] * B}
              fill="white"
            />
          )
        })}
        <PixelText
          content={`TOTAL ${view.showTotal ? String(total(p1)).padStart(2) : '  '}`}
          x={3.5 * B}
          y={13.75 * B}
          fill="white"
        />

        {p2 != null && (
          <g>
            <PixelText content={'Ⅱ-PLAYER'} x={11.5 * B} y={5.5 * B} fill="#e44437" />
            <PixelText content={String(scores[1])} x={11.5 * B} y={6.5 * B} fill="#feac4e" />
            {TANK_LEVELS.map((level) => {
              const n = p2[level]
              const count = n === -1 ? '  ' : String(n).padEnd(2)
              const points = n === -1 ? '    ' : String(n * TANK_KILL_SCORE_MAP[level]).padEnd(4)
              return (
                <PixelText
                  key={level}
                  content={`→ ${count} PTS ${points}`}
                  x={9 * B}
                  y={ROW_Y[level] * B}
                  fill="white"
                />
              )
            })}
            <PixelText
              content={`${view.showTotal ? String(total(p2)).padEnd(2) : '  '} TOTAL`}
              x={10 * B}
              y={13.75 * B}
              fill="white"
            />
          </g>
        )}
      </g>
    </g>
  )
}

function total(counts: Record<TankLevel, number>): number {
  return TANK_LEVELS.reduce((sum, level) => sum + counts[level], 0)
}
