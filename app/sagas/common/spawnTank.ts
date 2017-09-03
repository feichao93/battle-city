import { delay } from 'redux-saga'
import { put } from 'redux-saga/effects'
import { FlickerRecord, TankRecord } from 'types'
import { getNextId, frame as f } from 'utils/common'

// TODO 将flicker和add-tank的逻辑分离开来
export default function* spawnTank(tank: TankRecord, spawnSpeed = 1) {
  const flickerShapeTiming: Timing<FlickerShape> = [
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

  for (const [shape, time] of flickerShapeTiming) {
    yield put<Action.AddOrUpdateFlickerAction>({
      type: 'ADD_OR_UPDATE_FLICKER',
      flicker: FlickerRecord({
        flickerId,
        x: tank.x,
        y: tank.y,
        shape,
      }),
    })
    // todo 得考虑游戏暂停的情况
    yield delay(time / spawnSpeed)
  }
  yield put<Action.RemoveFlickerAction>({ type: 'REMOVE_FLICKER', flickerId })

  const tankId = getNextId('tank')
  yield put({
    type: 'ADD_TANK',
    tank: tank.set('tankId', tankId),
  })
  return tankId
}
