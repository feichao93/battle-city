import { put } from 'redux-saga/effects'
import { TankRecord } from '../../types'
import * as actions from '../../utils/actions'
import { asRect, getNextId } from '../../utils/common'
import { flickerSaga } from '../common'

export default function* spawnTank(tank: TankRecord, spawnSpeed = 1) {
  yield put(actions.startSpawnTank(tank))

  const areaId = getNextId('area')
  yield put(actions.addRestrictedArea(areaId, asRect(tank)))

  try {
    if (!DEV.FAST) {
      yield flickerSaga(tank.x, tank.y, spawnSpeed)
    }
    yield put(actions.addTank(tank.merge({ rx: tank.x, ry: tank.y })))
  } finally {
    yield put(actions.removeRestrictedArea(areaId))
  }
}
