import { useEffect } from 'react'
import { BLOCK_SIZE as B } from '../../engine/constants'
import { formatScore } from '../formatScore'
import { useMenuKeys } from '../menuKeys'
import { BrickPatternDef, brickPatternFill } from '../pixel/BrickWall'
import PixelText from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import TextButton from '../pixel/TextButton'
import useBlink from '../pixel/useBlink'
import { replace, stagePath } from '../router'
import { useUIStore, type LastGame } from '../store'

const LINE_HEIGHT = 12
const PLAYER_LABELS = ['Ⅰp-', 'Ⅱp-']

/** 以屏幕中线（x = 128）居中放置一行文字 */
function centerX(text: string, scale = 1): number {
  return 128 - text.length * 4 * scale
}

/** 各玩家分数与最高分，左对齐成一列居中 */
function ScoreLines({ result, hiScore, y }: { result: LastGame; hiScore: number; y: number }) {
  const lines = result.scores.map((score, i) => `${PLAYER_LABELS[i]}${formatScore(score)}`)
  lines.push(`HI-${formatScore(hiScore)}`)
  const x = centerX(lines[0])
  return (
    <g>
      {lines.map((line, i) => (
        <PixelText key={i} x={x} y={y + i * LINE_HEIGHT} content={line} />
      ))}
      {result.autopilot.map(
        (cpu, i) =>
          cpu && (
            <PixelText
              key={i}
              x={x + (lines[i].length + 1) * 8}
              y={y + i * LINE_HEIGHT}
              content="cpu"
              fill="#db2b00"
            />
          ),
      )}
      {result.newHiScore && <NewHiScore y={y + lines.length * LINE_HEIGHT + 4} />}
    </g>
  )
}

function NewHiScore({ y }: { y: number }) {
  const visible = useBlink()
  const text = 'new hi-score'
  return visible ? <PixelText x={centerX(text)} y={y} content={text} fill="#db2b00" /> : null
}

/**
 * 结束画面：失败显示砖纹 GAME OVER 与止步的关卡，通关显示 CONGRATULATIONS；
 * 下方是分数与最高分。画廊的 gameover 页复用。
 */
export function GameoverContent({
  result,
  hiScore,
  onConfirm,
}: {
  result: LastGame
  hiScore: number
  onConfirm?: () => void
}) {
  const hint = result.cleared ? 'press R to title' : 'press R to restart'
  const subtitle = result.cleared ? 'all stages cleared' : `stage ${result.stageName}`
  return (
    <g className="gameover-scene">
      <rect fill="#000000" x={0} y={0} width={16 * B} height={15 * B} />
      {result.cleared ? <CongratulationsTitle /> : <GameoverTitle />}
      <PixelText x={centerX(subtitle)} y={7 * B} content={subtitle} fill="#999999" />
      <ScoreLines result={result} hiScore={hiScore} y={8.5 * B} />
      <g transform={`translate(${centerX(hint, 0.5)}, ${13 * B}) scale(0.5)`}>
        <TextButton content={hint} x={0} y={0} textFill="#9ed046" onClick={onConfirm} />
      </g>
    </g>
  )
}

function GameoverTitle() {
  const scale = 4
  return (
    <g>
      <BrickPatternDef scale={scale} />
      <g transform={`scale(${scale})`}>
        <PixelText
          content="game"
          x={(4 * B) / scale}
          y={(1.5 * B) / scale}
          fill={brickPatternFill(scale)}
        />
        <PixelText
          content="over"
          x={(4 * B) / scale}
          y={(4 * B) / scale}
          fill={brickPatternFill(scale)}
        />
      </g>
    </g>
  )
}

function CongratulationsTitle() {
  const scale = 2
  const text = 'congratulations'
  return (
    <g>
      <BrickPatternDef scale={scale} />
      <g transform={`scale(${scale})`}>
        <PixelText
          content={text}
          x={centerX(text, scale) / scale}
          y={(4 * B) / scale}
          fill={brickPatternFill(scale)}
        />
      </g>
    </g>
  )
}

/** 结束页：失败按 R（或确认键）回到止步那关的选关页，通关回到标题页；Esc 回标题页 */
export default function GameOver({ result, multi }: { result: LastGame; multi: boolean }) {
  const hiScore = useUIStore((s) => s.hiScore)
  const confirm = () =>
    result.cleared ? replace('/') : replace(stagePath('choose', result.stageName, multi))

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') confirm()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })
  useMenuKeys((key) => {
    if (key === 'confirm') confirm()
    else if (key === 'back') replace('/')
  })

  return (
    <Screen>
      <GameoverContent result={result} hiScore={hiScore} onConfirm={confirm} />
    </Screen>
  )
}
