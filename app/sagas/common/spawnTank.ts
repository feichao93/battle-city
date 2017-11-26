import { put } from 'redux-saga/effects'
import { TankRecord } from 'types'
import { asRect, getNextId } from 'utils/common'
import { flickerSaga } from 'sagas/common'

export default function* spawnTank(tank: TankRecord, spawnSpeed = 1) {
  yield put<Action>({ type: 'START_SPAWN_TANK', tank })

  const areaId = getNextId('area')
  yield put<Action>({
    type: 'ADD_RESTRICTED_AREA',
    areaId,
    area: asRect(tank),
  })

  yield* flickerSaga(tank.x, tank.y, spawnSpeed)

  const tankId = getNextId('tank')
  yield put({
    type: 'ADD_TANK',
    tank: tank.set('tankId', tankId),
  })

  yield put<Action>({
    type: 'REMOVE_RESTRICTED_AREA',
    areaId,
  })

  return tankId
}
