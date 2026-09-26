import { frame, TANK_SIZE } from '../constants'
import type { Rect } from '../physics/geometry'
import type Tank from './Tank'

export type FlickerShape = 0 | 1 | 2 | 3

/** 出生星星的时间线（帧） */
const TIMELINE: ReadonlyArray<{ shape: FlickerShape; frames: number }> = [
  { shape: 3, frames: 3 },
  { shape: 2, frames: 3 },
  { shape: 1, frames: 3 },
  { shape: 0, frames: 3 },
  { shape: 1, frames: 3 },
  { shape: 2, frames: 3 },
  { shape: 3, frames: 3 },
  { shape: 2, frames: 3 },
  { shape: 1, frames: 3 },
  { shape: 0, frames: 3 },
  { shape: 1, frames: 3 },
  { shape: 2, frames: 3 },
  { shape: 3, frames: 1 },
]

/** 按原速播放一遍的总时长 */
export const FLICKER_DURATION = TIMELINE.reduce((sum, item) => sum + frame(item.frames), 0)

let nextFlickerId = 1

/** 坦克出生前的闪烁星星；播放完毕后由 BattleScene 把 tank 放入战场 */
export default class Flicker {
  readonly id: number
  readonly tank: Tank
  /** 播放速度倍率，bot 出生按 BOT_FLICKER_DURATION 换算 */
  private readonly speed: number
  private elapsed = 0
  done = false

  constructor(tank: Tank, speed = 1) {
    this.id = nextFlickerId++
    this.tank = tank
    this.speed = speed
  }

  get x(): number {
    return this.tank.x
  }

  get y(): number {
    return this.tank.y
  }

  shape(): FlickerShape {
    let acc = 0
    for (const item of TIMELINE) {
      acc += frame(item.frames) / this.speed
      if (this.elapsed < acc) {
        return item.shape
      }
    }
    return TIMELINE[TIMELINE.length - 1].shape
  }

  advance(delta: number): void {
    this.elapsed += delta
    if (this.elapsed >= FLICKER_DURATION / this.speed) {
      this.done = true
    }
  }

  rect(): Rect {
    return { x: this.x, y: this.y, width: TANK_SIZE, height: TANK_SIZE }
  }
}
