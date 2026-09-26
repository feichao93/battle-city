import { TANK_LEVELS } from './constants'
import type { TankLevel } from './types'

export interface StatisticsView {
  stageName: string
  /** 各玩家按等级的击杀数；-1 表示该行还没播放到 */
  counts: Record<TankLevel, number>[]
  showTotal: boolean
  /** 本关胜负确定时各玩家是否为托管，标题显示为 CPU */
  autopilot: boolean[]
}

interface StatisticsFrame {
  at: number
  level: TankLevel | null
  values: number[]
}

/** TOTAL 出现后停留的时长 */
const TOTAL_HOLD = 1000

/** 关卡结算的逐行计数动画 */
export default class StatisticsAnimation {
  readonly view: StatisticsView
  private readonly frames: StatisticsFrame[] = []
  private readonly end: number
  private elapsed = 0

  constructor(stageName: string, killInfo: Record<TankLevel, number>[], autopilot: boolean[]) {
    this.view = {
      stageName,
      counts: killInfo.map(() => emptyCounts(-1)),
      showTotal: false,
      autopilot,
    }
    let t = 500
    for (const level of TANK_LEVELS) {
      t += 250
      const killCount = Math.max(...killInfo.map((k) => k[level]))
      if (killCount === 0) {
        this.frames.push({ at: t, level, values: killInfo.map(() => 0) })
      } else {
        for (let n = 1; n <= killCount; n += 1) {
          this.frames.push({ at: t, level, values: killInfo.map((k) => Math.min(n, k[level])) })
          t += 160
        }
      }
      t += 200
    }
    t += 200
    this.frames.push({ at: t, level: null, values: [] })
    this.end = t + TOTAL_HOLD
  }

  get done(): boolean {
    return this.elapsed >= this.end
  }

  /** 推进动画；每播放一格回调一次（用于播放 statistics_1 音效） */
  advance(delta: number, onTick: () => void = () => {}): void {
    this.elapsed += delta
    while (this.frames.length > 0 && this.frames[0].at <= this.elapsed) {
      const f = this.frames.shift()!
      onTick()
      if (f.level == null) {
        this.view.showTotal = true
      } else {
        f.values.forEach((v, i) => {
          this.view.counts[i][f.level!] = v
        })
      }
    }
  }
}

export function emptyCounts(value: number): Record<TankLevel, number> {
  return { basic: value, fast: value, power: value, armor: value }
}
