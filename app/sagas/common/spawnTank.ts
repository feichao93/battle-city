import { put } from 'redux-saga/effects'
import { TankRecord } from 'types'
import { asRect, getNextId } from 'utils/common'
import { flickerSaga } from 'sagas/common'

export default function* spawnTank(tank: TankRecord, spawnSpeed = 1) {
  // TODO tankId 应该在caller那边生成比较好
  yield put<Action>({ type: 'START_SPAWN_TANK', tank })

  const areaId = getNextId('area')
  const tankId = getNextId('tank')
  yield put<Action>({
    type: 'ADD_RESTRICTED_AREA',
    areaId,
    area: asRect(tank),
  })

  try {
    if (!DEV.FAST) {
      yield flickerSaga(tank.x, tank.y, spawnSpeed)
    }
    yield put({ type: 'ADD_TANK', tank: tank.set('tankId', tankId) })
    return tankId
  } finally {
    yield put<Action>({
      type: 'REMOVE_RESTRICTED_AREA',
      areaId,
    })
  }
}
