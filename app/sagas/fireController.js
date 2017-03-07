import Mousetrap from 'mousetrap'
import { take, put, select } from 'redux-saga/effects'
import { calculateBulletStartPosition } from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

const bulletSpeed = 80 / 1000
const interval = 200

// todo 目前该saga只能控制player的fire动作
// 还需要玩家 以支持AI tank和palyer-2 tank的fire
export default function* fireController() {
  let pressing = false
  let pressed = false
  Mousetrap.bind('j', () => {
    pressing = true
    pressed = true
  }, 'keydown')
  Mousetrap.bind('j', () => (pressing = false), 'keyup')

  let countDown = interval
  while (true) {
    const { delta } = yield take(A.TICK)
    if (countDown > 0) {
      countDown -= delta
    } else {
      if ((pressing || pressed) && (yield select(selectors.canFire, 'player'))) {
        const tank = yield select(selectors.playerTank)
        if (tank == null) {
          continue
        }
        const { x, y, direction } = tank.toObject()
        yield put(Object.assign({
          type: A.ADD_BULLET,
          direction,
          owner: 'player',
          speed: bulletSpeed,
        }, calculateBulletStartPosition(x, y, direction)))
        countDown = interval
      }
    }
    pressed = false
  }
}
