import { put } from 'redux-saga/effects'
import { FlickerRecord } from '../../types'
import * as actions from '../../utils/actions'
import { frame as f, getNextId } from '../../utils/common'
import Timing from '../../utils/Timing'

const flickerShapeTiming = new Timing<FlickerShape>([
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
])

export default function* flickerSaga(x: number, y: number, spawnSpeed: number) {
  const flickerId = getNextId('flicker')

  try {
    yield* flickerShapeTiming.accelerate(spawnSpeed).iter(function*(shape) {
      yield put(actions.setFlicker(new FlickerRecord({ flickerId, x, y, shape })))
    })
  } finally {
    yield put(actions.removeFlicker(flickerId))
  }
}
