import BattleScene from './BattleScene'
import { frame, INITIAL_LIVES } from './constants'
import TerrainMap from './map/TerrainMap'
import StatisticsAnimation, { type StatisticsView } from './StatisticsAnimation'
import { expandBots, parseStage } from './map/parseStage'
import type { PlayerControl } from '../input/bindings'
import type InputManager from '../input/InputManager'
import type { AudioPort, Point, RawStageConfig, TankColor, TankLevel } from './types'

/** 入场幕布时间线（对应旧版 stageSaga.animateCurtainAndLoadMap） */
const CURTAIN_CLOSE = frame(30)
const MAP_LOAD_AT = CURTAIN_CLOSE + frame(20)
const CURTAIN_OPEN_AT = MAP_LOAD_AT + frame(20)
const ENTER_END = CURTAIN_OPEN_AT + frame(30)

/** 出结果到进入结算的等待（旧版 stageSaga） */
const WON_DELAY = 4000
const DEAD_DELAY = 3000

/** 战场内 GAME OVER 字样上升时长 + 停留（旧版 gameSaga.animateGameover） */
export const GAMEOVER_RISE_DURATION = 2000
const GAMEOVER_END = GAMEOVER_RISE_DURATION + 500

export type SessionPhase = 'enter' | 'playing' | 'statistics' | 'gameover' | 'ended'

/** 跨关保留的玩家状态，BattleScene 持有同一引用并原地修改 */
export interface PlayerState {
  control: PlayerControl
  color: TankColor
  spawnPos: Point
  lives: number
  score: number
  /** 上一关结束时存活坦克的等级；下一关直接以该等级出生且不扣命 */
  reservedTankLevel: TankLevel | null
}

export type PlayerConfig = Pick<PlayerState, 'control' | 'color' | 'spawnPos'>

/**
 * 一局游戏：跨关玩家状态 + 关卡流程状态机（入场幕布 → 对战 → 结算 → 下一关 / GAME OVER）。
 * 全部由逻辑时钟推进，BattleScene 只负责单关世界。
 */
export default class GameSession {
  readonly players: PlayerState[]
  phase: SessionPhase = 'enter'
  /** 当前阶段已经历的逻辑时间（ms） */
  phaseTime = 0
  stageIndex: number
  /** 首关地图载入之前为 null */
  scene: BattleScene | null = null
  private statisticsAnimation: StatisticsAnimation | null = null

  /** 出结果后到进入结算的剩余等待；null 表示本关尚未出结果 */
  private endingTimer: number | null = null

  constructor(
    private readonly stages: RawStageConfig[],
    startStageIndex: number,
    playerConfigs: PlayerConfig[],
    private readonly audio: AudioPort,
  ) {
    this.stageIndex = startStageIndex
    this.players = playerConfigs.map((config) => ({
      ...config,
      lives: INITIAL_LIVES,
      score: 0,
      reservedTankLevel: null,
    }))
  }

  get stage(): RawStageConfig {
    return this.stages[this.stageIndex]
  }

  /** 入场幕布闭合程度：0 完全打开，1 完全遮住战场 */
  /** 结算页的当前画面；不在结算阶段时为 null */
  get statistics(): StatisticsView | null {
    return this.statisticsAnimation?.view ?? null
  }

  get curtain(): number {
    if (this.phase !== 'enter') {
      return 0
    }
    if (this.phaseTime < CURTAIN_CLOSE) {
      return this.phaseTime / CURTAIN_CLOSE
    }
    if (this.phaseTime < CURTAIN_OPEN_AT) {
      return 1
    }
    return 1 - Math.min(1, (this.phaseTime - CURTAIN_OPEN_AT) / (ENTER_END - CURTAIN_OPEN_AT))
  }

  /** HUD 只在对战阶段显示（旧版 showHud / hideHud） */
  get hudVisible(): boolean {
    return this.phase === 'playing'
  }

  /** GAME OVER 字样上升进度 0~1 */
  get gameoverProgress(): number {
    return this.phase === 'gameover' ? Math.min(1, this.phaseTime / GAMEOVER_RISE_DURATION) : 0
  }

  /** 打完了全部关卡 */
  cleared = false

  get scores(): number[] {
    return this.players.map((p) => p.score)
  }

  step(delta: number, input: InputManager): void {
    this.phaseTime += delta
    switch (this.phase) {
      case 'enter':
        this.stepEnter(delta)
        break
      case 'playing':
        this.stepPlaying(delta, input)
        break
      case 'statistics':
        this.stepStatistics(delta)
        break
      case 'gameover':
        // 旧版在 GAME OVER 字样上升期间战场照常运行
        this.scene?.step(delta, input)
        if (this.phaseTime >= GAMEOVER_END) {
          this.enterPhase('ended')
        }
        break
      case 'ended':
        break
    }
  }

  private enterPhase(phase: SessionPhase): void {
    this.phase = phase
    this.phaseTime = 0
  }

  private stepEnter(delta: number): void {
    // 幕布完全遮住战场后才载入地图，这样上一关的画面会留在幕布后面
    const prev = this.phaseTime - delta
    if (prev < MAP_LOAD_AT && this.phaseTime >= MAP_LOAD_AT) {
      this.audio.play('stage_start')
      this.loadStage()
    }
    if (this.phaseTime >= ENTER_END) {
      this.endingTimer = null
      this.scene!.start()
      this.enterPhase('playing')
    }
  }

  private loadStage(): void {
    const raw = this.stage
    this.scene = new BattleScene(
      TerrainMap.fromRaw(raw),
      this.audio,
      expandBots(parseStage(raw).bots),
      this.players,
      this.stageIndex + 1,
    )
  }

  private stepPlaying(delta: number, input: InputManager): void {
    const scene = this.scene!
    scene.step(delta, input)

    if (this.endingTimer == null) {
      if (scene.status === 'won') {
        this.endingTimer = WON_DELAY
      } else if (scene.status === 'lost') {
        if (scene.loseReason === 'eagle') {
          // 老鹰被毁：不结算，直接播放 GAME OVER
          this.startGameover()
          return
        }
        this.endingTimer = DEAD_DELAY
      }
      return
    }

    this.endingTimer -= delta
    if (this.endingTimer <= 0) {
      this.startStatistics(scene)
    }
  }

  private startStatistics(scene: BattleScene): void {
    this.statisticsAnimation = new StatisticsAnimation(this.stage.name, scene.killInfo)
    this.enterPhase('statistics')
  }

  private stepStatistics(delta: number): void {
    const animation = this.statisticsAnimation!
    animation.advance(delta, () => this.audio.play('statistics_1'))
    if (!animation.done) {
      return
    }

    this.statisticsAnimation = null
    const scene = this.scene!
    if (scene.status === 'won') {
      scene.reserveTanks()
      if (this.stageIndex + 1 < this.stages.length) {
        this.stageIndex += 1
        this.enterPhase('enter')
        return
      }
      // 通关不升起 GAME OVER，直接进入结束页显示 CONGRATULATIONS
      this.cleared = true
      this.enterPhase('ended')
      return
    }
    this.startGameover()
  }

  private startGameover(): void {
    this.audio.play('game_over')
    this.enterPhase('gameover')
  }
}
