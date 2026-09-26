import { SCORE_POPUP_DURATION } from '../constants'

let nextScorePopupId = 1

/** 击杀 / 拾取道具时在原地弹出的分数 */
export default class ScorePopup {
  readonly id: number
  readonly score: number
  readonly x: number
  readonly y: number
  /** 击杀分数要等爆炸播完才出现（旧版 destroyTank 先 explosion 再 score） */
  private delay: number
  private remaining = SCORE_POPUP_DURATION
  done = false

  constructor(score: number, x: number, y: number, delay = 0) {
    this.id = nextScorePopupId++
    this.score = score
    this.x = x
    this.y = y
    this.delay = delay
  }

  get visible(): boolean {
    return this.delay <= 0
  }

  advance(delta: number): void {
    if (this.delay > 0) {
      this.delay -= delta
      return
    }
    this.remaining -= delta
    if (this.remaining <= 0) {
      this.done = true
    }
  }
}
