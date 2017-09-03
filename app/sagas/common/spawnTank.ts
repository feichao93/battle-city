import { put } from 'redux-saga/effects'
import { FlickerRecord, TankRecord } from 'types'
import { getNextId, frame as f } from 'utils/common'
import { timing } from 'sagas/common'

function applySpawnSpeed<T>(config: TimingConfig<T>, speed: number) {
  return config.map(([x, time]) => [x, time / speed] as [T, number])
}

// TODO 将flicker和add-tank的逻辑分离开来
export default function* spawnTank(tank: TankRecord, spawnSpeed = 1) {
  const flickerShapeTimingConfig: TimingConfig<FlickerShape> = [
    [3, f(3)],
    [2, f(3)],
    [1, f(3)],
    [0, f(3)],
    [1, f(3)],
    [2, f(3)],
    [3, f(3)],
    [2, f(3)],
    [1, f(3)],
    [0, f(3)],
    [1, f(3)],
    [2, f(3)],
    [3, f(1)],
  ]

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
