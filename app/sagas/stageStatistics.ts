import { Map } from 'immutable'
import { put, select } from 'redux-saga/effects'
import { State } from '../types'
import { TANK_LEVELS } from '../utils/constants'
import Timing from '../utils/Timing'

export default function* statistics() {
  yield put<Action>({ type: 'SHOW_STATISTICS' })

  const {
    game: { killInfo },
  }: State = yield select()

  const player1KillInfo = killInfo.get('player-1', Map<TankLevel, KillCount>())

  // todo 目前只考虑player-1的信息

  yield Timing.delay(DEV.FAST ? 200 : 500)

  for (const tankLevel of TANK_LEVELS) {
    const {
      game: { transientKillInfo },
    }: State = yield select()

    yield Timing.delay(DEV.FAST ? 100 : 250)
    const levelKillCount = player1KillInfo.get(tankLevel, 0)
    if (levelKillCount === 0) {
      // 如果击杀数是 0 的话，则直接在界面中显示 0
      yield put<Action.PlaySound>({ type: 'PLAY_SOUND', sound: 'statistics_1' })
      yield put<Action>({
        type: 'UPDATE_TRANSIENT_KILL_INFO',
        info: transientKillInfo.setIn(['player-1', tankLevel], 0),
      })
    } else {
      // 如果击杀数大于 0，则显示从 1 开始增加到击杀数的动画
      for (let count = 1; count <= levelKillCount; count += 1) {
        yield put<Action.PlaySound>({ type: 'PLAY_SOUND', sound: 'statistics_1' })
        yield put<Action>({
          type: 'UPDATE_TRANSIENT_KILL_INFO',
          info: transientKillInfo.setIn(['player-1', tankLevel], count),
        })
        yield Timing.delay(DEV.FAST ? 64 : 160)
      }
    }
    yield Timing.delay(DEV.FAST ? 80 : 200)
  }
  yield Timing.delay(DEV.FAST ? 80 : 200)
  yield put<Action.PlaySound>({ type: 'PLAY_SOUND', sound: 'statistics_1' })
  yield put<Action>({ type: 'SHOW_TOTAL_KILL_COUNT' })
  yield Timing.delay(DEV.FAST ? 400 : 1000)

  yield put<Action>({ type: 'HIDE_STATISTICS' })
}
