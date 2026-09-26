import { useId } from 'react'
import {
  BLOCK_SIZE as B,
  FIELD_SIZE,
  PLAYER_SPAWN_POS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  ZOOM_LEVEL,
} from '../engine/constants'
import { BotCountIndicator, PlayerTankThumbnail } from './pixel/icons'
import PauseMenu, { type PauseMenuProps } from './PauseMenu'
import PixelText from './pixel/PixelText'
import useBlink from './pixel/useBlink'

/** 叠加层需要的战斗状态快照；由 GameCanvas 从 GameSession 提取，值变化时才重渲染 */
export interface BattleView {
  hudVisible: boolean
  remainingBots: number
  lives: number[]
  /** 各玩家能否向队友借命 */
  canBorrowLife: boolean[]
  /** 入场幕布闭合程度 0~1 */
  curtain: number
  stageName: string
  /** 战场内 GAME OVER 字样上升进度；null 表示不显示 */
  gameoverProgress: number | null
}

/**
 * 战斗画面之上的 SVG 像素图层：HUD、GAME OVER 字样、入场幕布、暂停提示（自底向上，
 * 对应旧版 BattleFieldScene 的 HUD / TextLayer / CurtainsContainer；暂停菜单为重写版新增）。
 * pointer-events:none 让点击穿透到下层。
 */
export default function BattleOverlay({
  view,
  pauseMenu,
  awaitingKey,
}: {
  view: BattleView
  /** 暂停时显示的菜单；null 表示未暂停 */
  pauseMenu: PauseMenuProps | null
  /** 音频未解锁，等待玩家按键后才开局 */
  awaitingKey: boolean
}) {
  return (
    <svg
      width={SCREEN_WIDTH * ZOOM_LEVEL}
      height={SCREEN_HEIGHT * ZOOM_LEVEL}
      viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        imageRendering: 'pixelated',
      }}
    >
      {view.hudVisible && (
        <g transform={`translate(${FIELD_SIZE + 1.5 * B}, ${1.5 * B})`}>
          <HudContent remainingBots={view.remainingBots} lives={view.lives} />
        </g>
      )}
      {view.hudVisible &&
        view.canBorrowLife.map(
          (can, i) => can && <BorrowLifeHint key={i} spawnPos={SPAWN_POS_BY_PLAYER[i]} />,
        )}
      {view.gameoverProgress != null && <GameoverText progress={view.gameoverProgress} />}
      {view.curtain > 0 && <StageEnterCurtain t={view.curtain} stageName={view.stageName} />}
      {pauseMenu != null && <PauseMenu {...pauseMenu} />}
      {awaitingKey && <PressAnyKey />}
    </svg>
  )
}

/** 战场右侧的 HUD：剩余 bot 数与各玩家命数；画廊的 misc 页复用 */
export function HudContent({ remainingBots, lives }: { remainingBots: number; lives: number[] }) {
  return (
    <g className="hud">
      <BotCountIndicator count={remainingBots} />
      <g transform={`translate(0, ${6 * B})`}>
        {lives.map((n, i) => (
          <g key={i} transform={`translate(0, ${i * B})`}>
            <PixelText x={0} y={0} content={i === 0 ? 'Ⅰp' : 'Ⅱp'} fill="#000000" />
            <PlayerTankThumbnail x={0} y={0.5 * B} />
            <PixelText x={0.5 * B} y={0.5 * B} content={String(Math.max(0, n))} fill="#000000" />
          </g>
        ))}
      </g>
    </g>
  )
}

/** 红色 GAME OVER 从战场底部上升 6 格（旧版 gameSaga.animateGameover） */
function GameoverText({ progress }: { progress: number }) {
  const y = 13 * B - 6 * B * progress
  return (
    <g>
      <PixelText x={6.5 * B} y={y} content="game" fill="red" />
      <PixelText x={6.5 * B} y={y + 0.5 * B} content="over" fill="red" />
    </g>
  )
}

/** 灰色幕布从上下两侧合拢，只覆盖战场（旧版 StageEnterCurtain + Curtain） */
function StageEnterCurtain({ t, stageName }: { t: number; stageName: string }) {
  const clipId = useId()
  const size = 13 * B
  return (
    <g transform={`translate(${B}, ${B})`}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={size} height={(size / 2) * t} />
          <rect x={0} y={size * (1 - t / 2)} width={size} height={(size / 2) * t} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={size} height={size} fill="#757575" />
        <PixelText x={5 * B} y={6 * B} content={`stage  ${stageName}`} fill="#000000" />
      </g>
    </g>
  )
}

/** 与 PAUSE 同样以战场中线（x = 120）居中 */
function PressAnyKey() {
  const visible = useBlink()
  return visible ? <PixelText x={120 - 13 * 4} y={8 * B} content="press any key" /> : null
}

const SPAWN_POS_BY_PLAYER = [PLAYER_SPAWN_POS.player1, PLAYER_SPAWN_POS.player2]

/** 没命的玩家出生点上闪烁 PRESS FIRE，提示可以向队友借命 */
function BorrowLifeHint({ spawnPos }: { spawnPos: { x: number; y: number } }) {
  const visible = useBlink()
  if (!visible) {
    return null
  }
  // 半尺寸字，以出生点（战场原点在屏幕 (B, B)）的 16px 方格为中心
  const cx = B + spawnPos.x + 8
  const cy = B + spawnPos.y + 8
  return (
    <g transform={`translate(${cx}, ${cy}) scale(0.5)`}>
      <PixelText x={-20} y={-9} content="press" />
      <PixelText x={-16} y={1} content="fire" />
    </g>
  )
}
