import type InputManager from '../input/InputManager'
import type GameSession from './GameSession'

/** 逻辑定步：60Hz，每步 16.667ms */
export const STEP_MS = 1000 / 60
/** 单帧最多补偿的真实时间，避免卡顿后「死亡螺旋」 */
const MAX_FRAME_DELTA = 250

/**
 * 固定步长游戏循环（accumulator）。逻辑按 STEP_MS 定步推进若干次，
 * 渲染每帧一次，二者解耦以保证 AI/碰撞确定性。
 * 渲染通过 onRender 回调注入，引擎本身不依赖任何渲染框架。
 */
export default class Game {
  private accumulator = 0
  private lastTime = 0
  private rafId = 0
  private running = false
  private paused = false

  constructor(
    private readonly session: GameSession,
    private readonly input: InputManager,
    private readonly onRender: (session: GameSession) => void,
  ) {}

  setPaused(paused: boolean): void {
    this.paused = paused
    if (!paused) {
      // 恢复时重置时间基准，避免累计 delta 跳变
      this.lastTime = performance.now()
      this.accumulator = 0
      // 暂停菜单里按下的键（开火、上下）不应在恢复后作用到坦克上
      this.input.releaseAll()
    }
  }

  isPaused(): boolean {
    return this.paused
  }

  start(): void {
    if (this.running) {
      return
    }
    this.running = true
    this.input.attach()
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.frame)
  }

  private readonly frame = (now: number): void => {
    if (!this.running) {
      return
    }
    let delta = now - this.lastTime
    this.lastTime = now
    if (delta > MAX_FRAME_DELTA) {
      delta = MAX_FRAME_DELTA
    }
    // 暂停时不推进逻辑，仍渲染（以更新暂停遮罩）
    if (!this.paused) {
      this.accumulator += delta
      while (this.accumulator >= STEP_MS) {
        this.session.step(STEP_MS, this.input)
        this.input.endTick()
        this.accumulator -= STEP_MS
      }
    }
    this.onRender(this.session)
    this.rafId = requestAnimationFrame(this.frame)
  }

  stop(): void {
    if (!this.running) {
      return
    }
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.input.detach()
  }
}
