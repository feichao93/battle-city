import { put } from 'redux-saga/effects'
import { FlickerRecord, TankRecord } from 'types'
import { getNextId, frame as f } from 'utils/common'
import { timing } from 'sagas/common'

function applySpawnSpeed<V>(config: TimingConfig<V>, speed: number) {
  return config.map(({ t, v }) => ({ t: t / speed, v }))
}

// TODO 将flicker和add-tank的逻辑分离开来
export default function* spawnTank(tank: TankRecord, spawnSpeed = 1) {
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

  const flickerId = getNextId('flicker')

  yield* timing(applySpawnSpeed(flickerShapeTimingConfig, spawnSpeed), function* (shape) {
    yield put<Action.AddOrUpdateFlickerAction>({
      type: 'ADD_OR_UPDATE_FLICKER',
      flicker: FlickerRecord({
        flickerId,
        x: tank.x,
        y: tank.y,
        shape,
      }),
    })
  })

  yield put<Action.RemoveFlickerAction>({
    type: 'REMOVE_FLICKER',
    flickerId,
  })

  const tankId = getNextId('tank')
  yield put({
    type: 'ADD_TANK',
    tank: tank.set('tankId', tankId),
  })
  return tankId
}
