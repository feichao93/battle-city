import Mousetrap from 'mousetrap'
import { take, put, select } from 'redux-saga/effects'
import { calculateBulletStartPosition } from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

const bulletSpeed = 80 / 1000
const interval = 200

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
        const player = yield select(selectors.player)
        const { x, y, direction } = player.toObject()
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
