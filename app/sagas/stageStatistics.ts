import { Map } from 'immutable'
import { put, select } from 'redux-saga/effects'
import { State } from 'types'
import { TANK_LEVELS } from 'utils/constants'
import { nonPauseDelay } from 'sagas/common'

export default function* statistics() {
  yield put<Action>({ type: 'LOAD_SCENE', scene: 'statistics' })

  const { game: { killInfo } }: State = yield select()

  const player1KillInfo = killInfo.get('player-1', Map<TankLevel, KillCount>())

  // todo 目前只考虑player-1的信息

  yield nonPauseDelay(process.env.NODE_ENV === 'production' ? 500 : 200)

  for (const tankLevel of TANK_LEVELS) {
    const { game: { transientKillInfo } }: State = yield select()

    yield nonPauseDelay(process.env.NODE_ENV === 'production' ? 250 : 100)
    const levelKillCount = player1KillInfo.get(tankLevel, 0)
    if (levelKillCount === 0) {
      yield put<Action>({
        type: 'UPDATE_TRANSIENT_KILL_INFO',
        info: transientKillInfo.setIn(['player-1', tankLevel], 0),
      })
    } else {
      for (let count = 1; count <= levelKillCount; count += 1) {
        yield put<Action>({
          type: 'UPDATE_TRANSIENT_KILL_INFO',
          info: transientKillInfo.setIn(['player-1', tankLevel], count),
        })
        yield nonPauseDelay(process.env.NODE_ENV === 'production' ? 160 : 64)
      }
    }
    yield nonPauseDelay(process.env.NODE_ENV === 'production' ? 200 : 80)
  }
  yield nonPauseDelay(process.env.NODE_ENV === 'production' ? 200 : 80)
  yield put<Action>({ type: 'SHOW_TOTAL_KILL_COUNT' })
  yield nonPauseDelay(process.env.NODE_ENV === 'production' ? 1000 : 400)
}
