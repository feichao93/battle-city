import { useEffect, useRef, useState, type RefObject } from 'react'
import { Application } from 'pixi.js'
import audio from '../audio/AudioManager'
import { PLAYER_SPAWN_POS, SCREEN_HEIGHT, SCREEN_WIDTH, ZOOM_LEVEL } from '../engine/constants'
import Game, { STEP_MS } from '../engine/Game'
import GameSession, { type PlayerConfig } from '../engine/GameSession'
import type TerrainMap from '../engine/map/TerrainMap'
import type { StatisticsView } from '../engine/StatisticsAnimation'
import type { AudioPort, SoundName } from '../engine/types'
import InputManager from '../input/InputManager'
import Renderer, {
  type BulletView,
  type ExplosionView,
  type FlickerView,
  type PowerUpView,
  type ScorePopupView,
  type TankView,
} from '../render/Renderer'
import { sharedAtlas } from '../render/SpriteAtlas'
import { stages } from '../stages'
import BattleOverlay, { type BattleView } from '../ui/BattleOverlay'
import { INITIAL_VIEW, toView } from '../ui/GameCanvas'
import type { PauseMenuProps } from '../ui/PauseMenu'
import StatisticsScene from '../ui/StatisticsScene'
import { useUIStore } from '../ui/store'
import { finishLanGame, guestMirror, leaveRoom, onPeerMessage, sendLan } from './client'
import { SceneEncoder, type FrameMessage } from './frame'
import { decodeInput, encodeInput, HostInput, REMOTE_CONTROL, sampleInput } from './input'
import { nextPausedBy } from './pause'
import type { Role } from './protocol'

type StatisticsPayload = { view: StatisticsView; scores: number[] }

/** BattleScene 和客机的 SceneMirror 都满足这个形状 */
interface RenderableScene {
  map: TerrainMap | null
  time: number
  tanks: TankView[]
  bullets: BulletView[]
  explosions: ExplosionView[]
  powerUps: PowerUpView[]
  flickers: FlickerView[]
  scorePopups: ScorePopupView[]
}

/** 同 GameCanvas 的 onRender：换关时重新装载地图，再同步各层 */
function createSceneSync(renderer: Renderer): (scene: RenderableScene | null) => void {
  let mounted: TerrainMap | null = null
  return (scene) => {
    const map = scene?.map
    if (scene != null && map != null) {
      if (map !== mounted) {
        renderer.mountStage(map)
        mounted = map
      }
      renderer.syncTerrain(map, scene.time)
      renderer.syncPowerUps(scene.powerUps)
      renderer.syncTanks(scene.tanks, scene.time)
      renderer.syncBullets(scene.bullets)
      renderer.syncExplosions(scene.explosions)
      renderer.syncFlickers(scene.flickers)
      renderer.syncScorePopups(scene.scorePopups)
    }
    renderer.render()
  }
}

async function createApp(): Promise<Application> {
  const app = new Application()
  await app.init({
    width: SCREEN_WIDTH * ZOOM_LEVEL,
    height: SCREEN_HEIGHT * ZOOM_LEVEL,
    background: 0x000000,
    autoStart: false,
    roundPixels: true,
  })
  return app
}

/** 暂停方看到菜单，另一方只看到提示 */
function BattleFrame({
  containerRef,
  view,
  statistics,
  role,
  pausedBy,
  onResume,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  view: BattleView
  statistics: StatisticsPayload | null
  role: Role
  pausedBy: Role | null
  onResume: () => void
}) {
  const pauseMenu: PauseMenuProps | null =
    pausedBy === role
      ? {
          items: [
            { label: 'resume', onSelect: onResume },
            { label: 'leave room', onSelect: leaveRoom },
          ],
          controls: [useUIStore.getState().bindings.p1],
          firstPlayer: role === 'host' ? 0 : 1,
        }
      : null
  const pauseNotice =
    pausedBy != null && pausedBy !== role ? `${pausedBy === 'host' ? 'Ⅰp' : 'Ⅱp'} paused` : null
  return (
    <div style={{ position: 'relative', lineHeight: 0 }}>
      <div ref={containerRef} />
      {statistics != null && <StatisticsScene view={statistics.view} scores={statistics.scores} />}
      <BattleOverlay
        view={view}
        pauseMenu={pauseMenu}
        pauseNotice={pauseNotice}
        awaitingKey={false}
      />
    </div>
  )
}

/** 主机：跑引擎，本地键盘是 1P，客机输入是 2P，每个逻辑帧把画面广播给客机 */
export function LanHostBattle({ stageName }: { stageName: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<BattleView>(INITIAL_VIEW)
  const [statistics, setStatistics] = useState<StatisticsPayload | null>(null)
  const [pausedBy, setPausedBy] = useState<Role | null>(null)
  const requestPauseRef = useRef<((who: Role, paused: boolean) => void) | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container == null) return
    const { bindings } = useUIStore.getState()
    const input = new HostInput([bindings.p1, REMOTE_CONTROL])
    const unsubscribe = onPeerMessage((msg) => {
      if (msg.t === 'i') input.applyRemote(decodeInput(msg.b))
      else if (msg.t === 'pause') requestPauseRef.current?.('guest', msg.paused)
    })

    let app: Application | null = null
    let renderer: Renderer | null = null
    let game: Game | null = null
    let cancelled = false
    let paused: Role | null = null
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape') requestPauseRef.current?.('host', paused == null)
    }
    document.addEventListener('keydown', onEsc)
    // 标签页进后台后 rAF 停了，引擎不再推进；先暂停，客机才知道在等谁
    const onHidden = () => {
      if (document.hidden) requestPauseRef.current?.('host', true)
    }
    document.addEventListener('visibilitychange', onHidden)

    const init = async () => {
      const instance = await createApp()
      if (cancelled) {
        instance.destroy(true)
        return
      }
      app = instance
      container.appendChild(app.canvas)
      await audio.preload()
      if (cancelled) return

      const activeRenderer = new Renderer(app, sharedAtlas())
      renderer = activeRenderer
      const sync = createSceneSync(activeRenderer)

      const sounds: SoundName[] = []
      const port: AudioPort = {
        play: (name) => {
          audio.play(name)
          sounds.push(name)
        },
      }
      const players: PlayerConfig[] = [
        { control: bindings.p1, color: 'yellow', spawnPos: PLAYER_SPAWN_POS.player1 },
        { control: REMOTE_CONTROL, color: 'green', spawnPos: PLAYER_SPAWN_POS.player2 },
      ]
      const session = new GameSession(
        stages,
        Math.max(
          0,
          stages.findIndex((s) => s.name === stageName),
        ),
        players,
        port,
        { autopilot: null, random: Math.random },
      )
      const encoder = new SceneEncoder()
      let lastTick = -1
      let lastViewKey = ''
      let lastStatisticsKey = ''
      // 叠加层和结算页的变化攒到下一次广播再带上
      let pendingView: BattleView | undefined
      let pendingStatistics: StatisticsPayload | null | undefined
      let ended = false

      game = new Game(session, input, (s) => {
        sync(s.scene)

        const nextView = toView(s)
        const viewKey = JSON.stringify(nextView)
        if (viewKey !== lastViewKey) {
          lastViewKey = viewKey
          setView(nextView)
          pendingView = nextView
        }
        const statisticsKey = s.statistics == null ? '' : JSON.stringify(s.statistics)
        if (statisticsKey !== lastStatisticsKey) {
          lastStatisticsKey = statisticsKey
          const payload =
            s.statistics == null
              ? null
              : { view: structuredClone(s.statistics), scores: [...s.scores] }
          setStatistics(payload)
          pendingStatistics = payload
        }

        // 高刷屏上 rAF 比逻辑帧密，只在逻辑推进过之后广播
        if (input.ticks !== lastTick) {
          lastTick = input.ticks
          const msg: FrameMessage = { t: 'f', scene: encoder.encode(s.scene) }
          if (pendingView !== undefined) msg.view = pendingView
          if (pendingStatistics !== undefined) msg.statistics = pendingStatistics
          if (sounds.length > 0) msg.sounds = sounds.splice(0)
          pendingView = undefined
          pendingStatistics = undefined
          sendLan(msg)
        }

        if (s.phase === 'ended' && !ended) {
          ended = true
          finishLanGame({ stageName: s.stage.name, scores: s.scores, cleared: s.cleared })
        }
      })
      game.start()

      requestPauseRef.current = (who, wantPaused) => {
        const next = nextPausedBy(paused, who, wantPaused)
        if (next === paused || ended) return
        paused = next
        game!.setPaused(next != null)
        setPausedBy(next)
        audio.play('pause')
        sendLan({ t: 'paused', by: next })
      }
    }

    void init()

    return () => {
      cancelled = true
      requestPauseRef.current = null
      document.removeEventListener('keydown', onEsc)
      document.removeEventListener('visibilitychange', onHidden)
      unsubscribe()
      game?.stop()
      renderer?.destroy()
      app?.destroy(true)
    }
  }, [stageName])

  return (
    <BattleFrame
      containerRef={containerRef}
      view={view}
      statistics={statistics}
      role="host"
      pausedBy={pausedBy}
      onResume={() => requestPauseRef.current?.('host', false)}
    />
  )
}

/** 客机：不跑引擎，每个逻辑帧把本地 1P 键位的输入发给主机，按收到的画面渲染 */
export function LanGuestBattle() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<BattleView>(INITIAL_VIEW)
  const [statistics, setStatistics] = useState<StatisticsPayload | null>(null)
  const [pausedBy, setPausedBy] = useState<Role | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const mirror = guestMirror()
    if (container == null || mirror == null) return
    const control = useUIStore.getState().bindings.p1
    const input = new InputManager([control])
    input.attach()

    let paused: Role | null = null
    const unsubscribe = onPeerMessage((msg) => {
      if (msg.t !== 'paused') return
      paused = msg.by
      setPausedBy(msg.by)
      // 暂停菜单里按的键（开火、上下）不应在恢复后作用到坦克上
      input.releaseAll()
      audio.play('pause')
    })
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape') sendLan({ t: 'pause', paused: paused == null })
    }
    document.addEventListener('keydown', onEsc)
    // 客机进后台后不再发输入，主机会一直沿用最后一帧的按键
    const onHidden = () => {
      if (document.hidden) sendLan({ t: 'pause', paused: true })
    }
    document.addEventListener('visibilitychange', onHidden)

    let app: Application | null = null
    let renderer: Renderer | null = null
    let sync: ((scene: RenderableScene | null) => void) | null = null
    let cancelled = false
    let rafId = 0
    let lastTime = performance.now()
    let accumulator = 0
    let renderedFrames = -1
    let lastView: BattleView | null = null
    let lastStatistics: StatisticsPayload | null = null

    const frame = (now: number) => {
      accumulator += Math.min(now - lastTime, 250)
      lastTime = now
      while (accumulator >= STEP_MS) {
        // 暂停期间不发：用开火键选 resume 时，这次按下不能跟着恢复消息到达主机
        if (paused == null) sendLan({ t: 'i', b: encodeInput(sampleInput(input, control)) })
        input.endTick()
        accumulator -= STEP_MS
      }

      if (sync != null && mirror.frames !== renderedFrames) {
        renderedFrames = mirror.frames
        sync(mirror.scene)
      }
      const sounds = mirror.sounds
      mirror.sounds = []
      for (const name of sounds) audio.play(name)
      if (mirror.view != null && mirror.view !== lastView) {
        lastView = mirror.view
        setView(lastView)
      }
      if (mirror.statistics !== lastStatistics) {
        lastStatistics = mirror.statistics
        setStatistics(lastStatistics)
      }
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    const init = async () => {
      const instance = await createApp()
      if (cancelled) {
        instance.destroy(true)
        return
      }
      app = instance
      container.appendChild(app.canvas)
      renderer = new Renderer(app, sharedAtlas())
      sync = createSceneSync(renderer)
    }
    void init()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      unsubscribe()
      document.removeEventListener('keydown', onEsc)
      document.removeEventListener('visibilitychange', onHidden)
      input.detach()
      renderer?.destroy()
      app?.destroy(true)
    }
  }, [])

  return (
    <BattleFrame
      containerRef={containerRef}
      view={view}
      statistics={statistics}
      role="guest"
      pausedBy={pausedBy}
      onResume={() => sendLan({ t: 'pause', paused: false })}
    />
  )
}
