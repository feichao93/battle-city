import { Map } from 'immutable'
import { put, select } from 'redux-saga/effects'
import { State } from '../types'
import * as actions from '../utils/actions'
import { TANK_LEVELS } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'

export default function* animateStatistics() {
  yield put(actions.showStatistics())

  const state: State = yield select()

  // 这里总是执行双人模式下的逻辑，但在单人摸下，渲染那边只会显示 player-1 的击杀信息
  const player1KillInfo = state.game.killInfo.get('player-1', Map<TankLevel, number>())
  const player2KillInfo = state.game.killInfo.get('player-2', Map<TankLevel, number>())

  yield Timing.delay(DEV.FAST ? 200 : 500)

  for (const tankLevel of TANK_LEVELS) {
    const tki = yield select((s: State) => s.game.transientKillInfo)

    yield Timing.delay(DEV.FAST ? 100 : 250)
    const count1 = player1KillInfo.get(tankLevel, 0)
    const count2 = player2KillInfo.get(tankLevel, 0)
    const killCount = Math.max(count1, count2)

    if (killCount === 0) {
      // 如果击杀数是 0 的话，则直接在界面中显示 0
      yield put(actions.playSound('statistics_1'))
      yield put(
        actions.updateTransientKillInfo(
          tki.setIn(['player-1', tankLevel], 0).setIn(['player-2', tankLevel], 0),
        ),
      )
    } else {
      // 如果击杀数大于 0，则显示从 1 开始增加到击杀数的动画
      for (let n = 1; n <= killCount; n += 1) {
        yield put(actions.playSound('statistics_1'))
        yield put(
          actions.updateTransientKillInfo(
            tki
              .setIn(['player-1', tankLevel], Math.min(n, count1))
              .setIn(['player-2', tankLevel], Math.min(n, count2)),
          ),
        )
        yield Timing.delay(DEV.FAST ? 64 : 160)
      }
    }
    yield Timing.delay(DEV.FAST ? 80 : 200)
  }
  yield Timing.delay(DEV.FAST ? 80 : 200)
  yield put(actions.playSound('statistics_1'))
  yield put(actions.showTotalKillCount())
  yield Timing.delay(DEV.FAST ? 400 : 1000)

  yield put(actions.hideStatistics())
}
