import { frame } from '../constants'
import type { ExplosionShape, Point } from '../types'

let nextExplosionId = 1

/** 小爆炸（子弹命中）时间线：s0→s1→s2，各持续 4/3/2 帧 */
const SMALL_TIMELINE: ReadonlyArray<{ shape: ExplosionShape; duration: number }> = [
  { shape: 's0', duration: frame(4) },
  { shape: 's1', duration: frame(3) },
  { shape: 's2', duration: frame(2) },
]

/** 大爆炸（坦克）时间线：s0→s1→s2→b0→b1→s2 */
const BIG_TIMELINE: ReadonlyArray<{ shape: ExplosionShape; duration: number }> = [
  { shape: 's0', duration: frame(7) },
  { shape: 's1', duration: frame(5) },
  { shape: 's2', duration: frame(7) },
  { shape: 'b0', duration: frame(5) },
  { shape: 'b1', duration: frame(7) },
  { shape: 's2', duration: frame(5) },
]

/** 坦克爆炸总时长：玩家在爆炸结束后才开始复活，bot 在爆炸结束后才补位 */
export const BIG_EXPLOSION_DURATION = BIG_TIMELINE.reduce((sum, f) => sum + f.duration, 0)

export type ExplosionKind = 'small' | 'big'

/** 爆炸动画实体（可变）。中心坐标固定，按时间线推进 shape，结束后置 done。 */
export default class Explosion {
  readonly id: number
  readonly cx: number
  readonly cy: number
  readonly kind: ExplosionKind
  private elapsed = 0
  done = false

  constructor(center: Point, kind: ExplosionKind) {
    this.id = nextExplosionId++
    this.cx = center.x
    this.cy = center.y
    this.kind = kind
  }

  private get timeline(): ReadonlyArray<{ shape: ExplosionShape; duration: number }> {
    return this.kind === 'big' ? BIG_TIMELINE : SMALL_TIMELINE
  }

  /** 当前应显示的形状 */
  shape(): ExplosionShape {
    let acc = 0
    for (const frame of this.timeline) {
      acc += frame.duration
      if (this.elapsed < acc) {
        return frame.shape
      }
    }
    return this.timeline[this.timeline.length - 1].shape
  }

  advance(delta: number): void {
    this.elapsed += delta
    const total = this.timeline.reduce((sum, f) => sum + f.duration, 0)
    if (this.elapsed >= total) {
      this.done = true
    }
  }
}

/** 仅用于测试：重置自增 id */
export function resetExplosionIds(): void {
  nextExplosionId = 1
}
