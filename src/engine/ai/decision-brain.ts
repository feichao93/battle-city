import type Tank from '../entities/Tank'
import type { Direction, Input } from '../types'
import type { AIContext, TankController } from './controller'
import type { Action, DecisionAnswers, DecisionClient, DecisionState } from './decision'
import { observe } from './observation'
import { buildPrompt, digDirection } from './prompt'

/** 相邻两次请求发出的最小间隔（逻辑时间 ms）；往返比它长时结果一到就发下一次 */
const DECISION_INTERVAL = 100
/** 请求超过这么久没回来就停下，不再等它 */
const DECISION_TIMEOUT = 1000
const HOLD: Record<Direction, boolean> = { up: false, down: false, left: false, right: false }
/**
 * 反向开动的概率要比当前开动方向高出这么多才掉头。两个相反方向概率接近时模型会逐次来回切换，
 * 写进选项的「掉头」标注也压不住（v8 抖动 17%）
 */
const SWITCH_MARGIN = 0.2
const REVERSE: Partial<Record<Action, Action>> = {
  move_up: 'move_down',
  move_down: 'move_up',
  move_left: 'move_right',
  move_right: 'move_left',
}

/** 选中的是当前开动方向的反向、又没明显更好时，继续按当前方向开 */
function smooth(current: Action, answers: DecisionAnswers): Action {
  const { choice, probabilities } = answers.action
  const keep = probabilities[current]
  if (REVERSE[current] !== choice || keep == null) return choice
  return (probabilities[choice] ?? 0) - keep < SWITCH_MARGIN ? current : choice
}
/** 发给模型最近这么多次决策的 action */
const HISTORY = 10
/** fire_* 的 P(yes) 超过它才开火 */
const FIRE_THRESHOLD = 0.5

type Outcome = { ok: true; answers: DecisionAnswers; state: DecisionState } | { ok: false }

function actionInput(action: Action, tank: Tank): Input | null {
  if (action === 'stay') return null
  const [kind, direction] = action.split('_') as ['move' | 'face', Direction]
  if (tank.direction !== direction) return { type: 'turn', direction }
  return kind === 'move' ? { type: 'forward' } : null
}

/**
 * 托管玩家坦克：每次决策把战况（observe）发给决策模型，按返回的 action 驾驶，按当前朝向那个方向的 fire_* 开火；
 * 选了朝砖墙开动时，转过去之后一直开火打砖。
 * 同一时刻最多一个请求在飞；结果到手前沿用上一个动作，失败或超时就停下不开火。
 * 结果在下一个 tick 才生效，免得在两个 tick 之间改动坦克状态
 */
export default class DecisionBrain implements TankController {
  private action: Action = 'stay'
  private firing = HOLD
  private digging: Direction | null = null
  /** 最近几次决策实际执行的 action，从早到晚 */
  private readonly history: Action[] = []
  /** 在飞请求的序号；超时作废后迟到的结果按序号丢弃 */
  private seq = 0
  private sentAt: number | null = null
  private nextAt = 0
  private outcome: Outcome | null = null

  constructor(
    private readonly player: number,
    private readonly decide: DecisionClient,
  ) {}

  move(tank: Tank, ctx: AIContext): Input | null {
    this.settle(ctx)
    if (this.sentAt == null && ctx.time >= this.nextAt) {
      this.send(tank, ctx)
    }
    return actionInput(this.action, tank)
  }

  fire(tank: Tank): boolean {
    return this.firing[tank.direction] || this.digging === tank.direction
  }

  private settle(ctx: AIContext): void {
    if (this.outcome != null) {
      if (this.outcome.ok) {
        const { answers } = this.outcome
        this.action = smooth(this.action, answers)
        this.firing = {
          up: answers.fire_up.noul > FIRE_THRESHOLD,
          down: answers.fire_down.noul > FIRE_THRESHOLD,
          left: answers.fire_left.noul > FIRE_THRESHOLD,
          right: answers.fire_right.noul > FIRE_THRESHOLD,
        }
        this.digging = digDirection(this.action, this.outcome.state)
      } else {
        this.stop()
      }
      this.history.push(this.action)
      if (this.history.length > HISTORY) this.history.shift()
      this.nextAt = this.sentAt! + DECISION_INTERVAL
      this.outcome = null
      this.sentAt = null
    } else if (this.sentAt != null && ctx.time - this.sentAt > DECISION_TIMEOUT) {
      this.stop()
      this.seq += 1
      this.sentAt = null
    }
  }

  private stop(): void {
    this.action = 'stay'
    this.firing = HOLD
    this.digging = null
  }

  private send(tank: Tank, ctx: AIContext): void {
    const seq = ++this.seq
    this.sentAt = ctx.time
    const state = observe(tank, ctx, [...this.history])
    const request = { player: this.player, time: ctx.time, state, prompt: buildPrompt(state) }
    this.decide(request).then(
      (answers) => {
        if (seq === this.seq) this.outcome = { ok: true, answers, state }
      },
      () => {
        if (seq === this.seq) this.outcome = { ok: false }
      },
    )
  }
}
