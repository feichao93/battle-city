import { take, put, select } from 'redux-saga/effects'
import { calculateBulletStartPosition } from 'utils/common'
import { SIDE } from 'utils/constants'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

export default function* fireController(playerName, shouldFire) {
  let countDown = 0
  while (true) {
    const { delta } = yield take(A.TICK)
    if (countDown > 0) {
      countDown -= delta
    } else {
      if (shouldFire() && (yield select(selectors.canFire, playerName))) {
        const tank = yield select(selectors.playerTank, playerName)
        if (tank == null) {
          continue
        }
        const { x, y, direction, bulletSpeed, bulletInterval } = tank.toObject()
        yield put(Object.assign({
          type: A.ADD_BULLET,
          side: SIDE.PLAYER,
          direction,
          owner: playerName,
          speed: bulletSpeed,
        }, calculateBulletStartPosition(x, y, direction)))
        countDown = bulletInterval
      }
    }
  }
}
