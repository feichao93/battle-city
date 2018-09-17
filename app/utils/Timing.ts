import { clamp } from 'lodash'
import { Effect, take } from 'redux-saga/effects'
import * as actions from '../utils/actions'

const add = (x: number, y: number) => x + y

export default class Timing<V> {
  /** 用于生成等待一段时间的effect.
   * 该函数作用和delay类似, 不过该函数会考虑游戏暂停的情况 */
  static *delay(ms: number) {
    let acc = 0
    while (true) {
      const { delta }: actions.Tick = yield take(actions.A.Tick)
      acc += delta
      if (acc >= ms) {
        break
      }
    }
  }

  static *tween(duration: number, effectFactory: (t: number) => Effect) {
    let accumulation = 0
    while (accumulation < duration) {
      const { delta }: actions.Tick = yield take(actions.A.Tick)
      accumulation += delta
      yield effectFactory(clamp(accumulation / duration, 0, 1))
    }
  }

  readonly sum: number
  constructor(readonly array: ReadonlyArray<{ t: number; v: V }>) {
    this.sum = array.map(item => item.t).reduce(add)
  }

  find(time: number) {
    let rem = time % this.sum
    let index = 0
    while (this.array[index].t < rem) {
      rem -= this.array[index].t
      index += 1
    }
    return this.array[index].v
  }

  accelerate(speed: number) {
    return new Timing<V>(this.array.map(({ t, v }) => ({ t: t / speed, v })))
  }

  *iter(handler: (v: V) => Iterable<any>) {
    let acc = 0
    let target = 0
    for (const { t, v } of this.array) {
      yield* handler(v)

      target += t
      while (true) {
        const { delta }: actions.Tick = yield take(actions.A.Tick)
        acc += delta
        if (acc >= target) {
          break
        }
      }
    }
  }
}
