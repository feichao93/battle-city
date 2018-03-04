import { put } from 'redux-saga/effects'
import { getNextId, frame as f } from 'utils/common'
import { timing } from 'sagas/common'
import { applySpawnSpeed } from 'sagas/common/timing'
import { FlickerRecord } from 'types'

const flickerShapeTimingConfig = [
  { v: 3, t: f(3) },
  { v: 2, t: f(3) },
  { v: 1, t: f(3) },
  { v: 0, t: f(3) },
  { v: 1, t: f(3) },
  { v: 2, t: f(3) },
  { v: 3, t: f(3) },
  { v: 2, t: f(3) },
  { v: 1, t: f(3) },
  { v: 0, t: f(3) },
  { v: 1, t: f(3) },
  { v: 2, t: f(3) },
  { v: 3, t: f(1) },
] as TimingConfig<FlickerShape>

export default function* flickerSaga(x: number, y: number, spawnSpeed: number) {
  const flickerId = getNextId('flicker')

  yield* timing(applySpawnSpeed(flickerShapeTimingConfig, spawnSpeed), function*(shape) {
    yield put<Action.AddOrUpdateFlickerAction>({
      type: 'ADD_OR_UPDATE_FLICKER',
      flicker: new FlickerRecord({ flickerId, x, y, shape }),
    })
  })

  yield put<Action.RemoveFlickerAction>({
    type: 'REMOVE_FLICKER',
    flickerId,
  })
}
