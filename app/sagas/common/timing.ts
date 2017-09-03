import { take, call } from 'redux-saga/effects'

export default function* timing<T>(config: TimingConfig<T>, handler: (t: T) => Iterable<any>) {
  let acc = 0
  let target = 0
  for (const [t, time] of config) {
    yield* handler(t)

    target += time
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
  return call(timing, [[null, ms]], () => [] as any)
}
