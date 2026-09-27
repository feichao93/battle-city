import { useEffect, useRef, useState } from 'react'
import { Application, TextureSource } from 'pixi.js'
import audio from '../audio/AudioManager'
import { PLAYER_SPAWN_POS, SCREEN_HEIGHT, SCREEN_WIDTH, ZOOM_LEVEL } from '../engine/constants'
import type BattleScene from '../engine/BattleScene'
import Game from '../engine/Game'
import GameSession, { type PlayerConfig } from '../engine/GameSession'
import type { StatisticsView } from '../engine/StatisticsAnimation'
import InputManager from '../input/InputManager'
import Renderer from '../render/Renderer'
import { sharedAtlas } from '../render/SpriteAtlas'
import BattleOverlay, { type BattleView } from './BattleOverlay'
import StatisticsScene from './StatisticsScene'
import { playersSearch, replace, stagePath } from './router'
import { allStages, useUIStore } from './store'

// 全局像素风：纹理放大时用最近邻采样
TextureSource.defaultOptions.scaleMode = 'nearest'

type LeaveAction = 'restart' | 'stage-select' | 'title'

export const INITIAL_VIEW: BattleView = {
  hudVisible: false,
  remainingBots: 0,
  lives: [],
  autopilot: [],
  canBorrowLife: [],
  curtain: 0,
  stageName: '',
  gameoverProgress: null,
}

export function toView(session: GameSession): BattleView {
  const scene = session.scene
  return {
    hudVisible: session.hudVisible,
    remainingBots: scene?.remainingBotCount ?? 0,
    lives: scene?.lives ?? [],
    autopilot: session.players.map((p) => p.pilot === 'autopilot'),
    canBorrowLife: scene?.canBorrowLife ?? [],
    curtain: session.curtain,
    stageName: session.stage.name,
    gameoverProgress: session.phase === 'gameover' ? session.gameoverProgress : null,
  }
}

export default function GameCanvas({ stageName, multi }: { stageName: string; multi: boolean }) {
  const [start, setStart] = useState({ stageName, run: 0 })
  // 对局推进到的关卡；进入下一关时 URL 随之替换，不应触发重开
  const sessionStageRef = useRef(stageName)

  // 原版行为：对局中手动修改地址栏里的关卡名则从该关重新开始
  useEffect(() => {
    if (stageName !== sessionStageRef.current) {
      sessionStageRef.current = stageName
      setStart((prev) => ({ stageName, run: prev.run + 1 }))
    }
  }, [stageName])

  const onStageChange = (name: string) => {
    sessionStageRef.current = name
    replace(stagePath('stage', name, multi))
  }

  const onLeave = (action: LeaveAction) => {
    if (action === 'restart') {
      setStart((prev) => ({ stageName: sessionStageRef.current, run: prev.run + 1 }))
    } else if (action === 'stage-select') {
      replace(stagePath('choose', sessionStageRef.current, multi))
    } else {
      replace('/')
    }
  }

  return (
    <Battle
      key={`${start.run}${multi}`}
      startStageName={start.stageName}
      multi={multi}
      onStageChange={onStageChange}
      onLeave={onLeave}
    />
  )
}

function Battle(props: {
  startStageName: string
  multi: boolean
  onStageChange: (stageName: string) => void
  /** 暂停菜单里除 resume 以外的选项 */
  onLeave: (action: LeaveAction) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<BattleView>(INITIAL_VIEW)
  const [statistics, setStatistics] = useState<{ view: StatisticsView; scores: number[] } | null>(
    null,
  )
  const [paused, setPaused] = useState(false)
  const togglePauseRef = useRef<(() => void) | null>(null)
  const [controls] = useState(() => {
    const { bindings } = useUIStore.getState()
    return props.multi ? [bindings.p1, bindings.p2] : [bindings.p1]
  })
  const [awaitingKey, setAwaitingKey] = useState(false)

  useEffect(() => {
    const { startStageName, multi, onStageChange } = props
    const container = containerRef.current
    if (container == null) return

    const { customStages, bindings, autopilot } = useUIStore.getState()
    const stages = allStages(customStages)

    let app: Application | null = null
    let renderer: Renderer | null = null
    let game: Game | null = null
    let onEsc: ((e: KeyboardEvent) => void) | null = null
    let stopAwaitingKey: (() => void) | null = null
    let cancelled = false

    const init = async () => {
      const instance = new Application()
      await instance.init({
        width: SCREEN_WIDTH * ZOOM_LEVEL,
        height: SCREEN_HEIGHT * ZOOM_LEVEL,
        background: 0x000000,
        autoStart: false,
        roundPixels: true,
      })
      if (cancelled) {
        instance.destroy(true)
        return
      }
      app = instance
      container.appendChild(app.canvas)

      // 开场 stage_start 在入场幕布合拢时播放，必须等音效解码完再开局
      await audio.preload()
      if (cancelled) {
        return
      }
      // 直接打开对局链接时还没有用户手势，不先按键的话开场音效播不出来
      if (audio.locked) {
        setAwaitingKey(true)
        await new Promise<void>((resolve) => {
          const onGesture = () => {
            void audio.unlock().then(() => {
              if (!audio.locked) {
                stopAwaitingKey?.()
                resolve()
              }
            })
          }
          document.addEventListener('keydown', onGesture)
          document.addEventListener('pointerdown', onGesture)
          stopAwaitingKey = () => {
            document.removeEventListener('keydown', onGesture)
            document.removeEventListener('pointerdown', onGesture)
            stopAwaitingKey = null
          }
        })
        if (cancelled) {
          return
        }
        setAwaitingKey(false)
      }

      const activeRenderer = new Renderer(app, sharedAtlas())
      renderer = activeRenderer

      const players: PlayerConfig[] = [
        { control: bindings.p1, color: 'yellow', spawnPos: PLAYER_SPAWN_POS.player1 },
      ]
      if (multi) {
        players.push({ control: bindings.p2, color: 'green', spawnPos: PLAYER_SPAWN_POS.player2 })
      }
      const session = new GameSession(
        stages,
        stages.findIndex((stage) => stage.name === startStageName),
        players,
        audio,
        { autopilot, random: Math.random },
      )

      let mountedScene: BattleScene | null = null
      let lastViewKey = ''
      let lastStatisticsKey = ''
      let ended = false
      let currentStageName = startStageName

      game = new Game(session, new InputManager(players.map((p) => p.control)), (s) => {
        const scene = s.scene
        if (scene != null) {
          if (scene !== mountedScene) {
            activeRenderer.mountStage(scene.map)
            mountedScene = scene
          }
          activeRenderer.syncTerrain(scene.map, scene.time)
          activeRenderer.syncPowerUps(scene.powerUps)
          activeRenderer.syncTanks(scene.tanks, scene.time)
          activeRenderer.syncBullets(scene.bullets)
          activeRenderer.syncExplosions(scene.explosions)
          activeRenderer.syncFlickers(scene.flickers)
          activeRenderer.syncScorePopups(scene.scorePopups)
        }
        activeRenderer.render()

        if (s.stage.name !== currentStageName) {
          currentStageName = s.stage.name
          onStageChange(currentStageName)
        }

        // React 叠加层只在快照变化时更新，避免每帧重渲染
        const nextView = toView(s)
        const viewKey = JSON.stringify(nextView)
        if (viewKey !== lastViewKey) {
          lastViewKey = viewKey
          setView(nextView)
        }
        const statisticsKey = s.statistics == null ? '' : JSON.stringify(s.statistics)
        if (statisticsKey !== lastStatisticsKey) {
          lastStatisticsKey = statisticsKey
          setStatistics(
            s.statistics == null ? null : { view: structuredClone(s.statistics), scores: s.scores },
          )
        }

        if (s.phase === 'ended' && !ended) {
          ended = true
          useUIStore.getState().finishGame({
            stageName: s.stage.name,
            scores: s.scores,
            cleared: s.cleared,
            autopilot: s.stageEndAutopilot ?? s.players.map(() => false),
          })
          replace(`/gameover${playersSearch(multi)}`)
        }
      })
      game.start()

      // ESC 和暂停菜单的 resume 共用
      togglePauseRef.current = () => {
        if (game == null || ended) return
        const next = !game.isPaused()
        game.setPaused(next)
        setPaused(next)
        audio.play('pause')
      }
      onEsc = (e: KeyboardEvent) => {
        if (e.code === 'Escape') togglePauseRef.current?.()
      }
      document.addEventListener('keydown', onEsc)

      if (import.meta.env.DEV) {
        ;(window as unknown as { __battle?: unknown }).__battle = { session, game }
      }
    }

    void init()

    return () => {
      cancelled = true
      stopAwaitingKey?.()
      if (onEsc != null) {
        document.removeEventListener('keydown', onEsc)
        onEsc = null
      }
      if (game != null) {
        game.stop()
        game = null
      }
      if (renderer != null) {
        renderer.destroy()
        renderer = null
      }
      if (app != null) {
        app.destroy(true)
        app = null
      }
    }
    // 重开由 GameCanvas 换 key 重新挂载触发，这里只在挂载时开局一次
  }, [])

  return (
    <div style={{ position: 'relative', lineHeight: 0 }}>
      <div ref={containerRef} />
      {statistics != null && <StatisticsScene view={statistics.view} scores={statistics.scores} />}
      <BattleOverlay
        view={view}
        pauseMenu={
          paused
            ? {
                controls,
                items: [
                  { label: 'resume', onSelect: () => togglePauseRef.current?.() },
                  { label: 'restart stage', onSelect: () => props.onLeave('restart') },
                  { label: 'stage select', onSelect: () => props.onLeave('stage-select') },
                  { label: 'title', onSelect: () => props.onLeave('title') },
                ],
              }
            : null
        }
        awaitingKey={awaitingKey}
      />
    </div>
  )
}
