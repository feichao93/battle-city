import { clamp } from 'lodash'
import { Effect } from 'redux-saga'
import { take, call } from 'redux-saga/effects'

export default function* timing<V>(config: TimingConfig<V>, handler: (v: V) => Iterable<any>) {
  let acc = 0
  let target = 0
  for (const { t, v } of config) {
    yield* handler(v)

    target += t
    while (true) {
      const { delta }: Action.TickAction = yield take('TICK')
      acc += delta
      if (acc >= target) {
        break
      }
    }
  }
}

/** 用于生成等待一段时间的effect.
 * 该函数作用和delay类似, 不过该函数会考虑游戏暂停的情况 */
export function nonPauseDelay(ms: number) {
  return call(timing, [{ v: null, t: ms }], () => [] as any)
}

export function* tween(duration: number, effectFactory: (t: number) => Effect) {
  let accumulation = 0
  while (accumulation < duration) {
    const { delta }: Action.TickAction = yield take('TICK')
    accumulation += delta
    yield effectFactory(clamp(accumulation / duration, 0, 1))
  }
}
