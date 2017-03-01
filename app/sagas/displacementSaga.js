import { take, put, select } from 'redux-saga/effects'
import { UP, DOWN, LEFT, RIGHT } from 'utils/constants'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

export default function* displacementSaga() {
  while (true) {
    const { delta } = yield take(A.TICK)
    // bullets运动
    const bullets = yield select(selectors.bullets)
    if (!bullets.isEmpty()) {
      const newBullets = bullets.map((b) => {
        const { direction, speed, x, y } = b
        if (direction === UP) {
          return b.set('y', y - speed * delta)
        } else if (direction === DOWN) {
          return b.set('y', y + speed * delta)
        } else if (direction === LEFT) {
          return b.set('x', x - speed * delta)
        } else if (direction === RIGHT) {
          return b.set('x', x + speed * delta)
        } else {
          throw new Error(`Invalid direction ${direction}`)
        }
      })

      yield put({
        type: A.SET_BULLETS,
        bullets: newBullets,
      })
    }
  }
}
