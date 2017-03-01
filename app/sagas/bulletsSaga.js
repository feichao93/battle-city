import * as R from 'ramda'
import { takeEvery } from 'redux-saga'
import { put, select } from 'redux-saga/effects'
import { BULLET_SIZE, FIELD_BSIZE, BLOCK_SIZE, DIRECTION_MAP } from 'utils/constants'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

function* update({ delta }) {
  const bullets = yield select(selectors.bullets)
  const newBullets = bullets.map((bullet) => {
    const { direction, speed } = bullet
    const distance = speed * delta
    const [xy, incdec] = DIRECTION_MAP[direction]
    return bullet.update(xy, incdec === 'inc' ? R.add(distance) : R.subtract(R.__, distance))
  })
  yield put({ type: A.SET_BULLETS, bullets: newBullets })
}

function* afterUpdate() {
  let bullets = yield select(selectors.bullets)
  // todo 判断是否有和其他坦克相撞
  // todo 判断是否有和其他子弹相撞
  // todo 判断是否有和brickWall/steelWall等物体碰撞

  // 判断是否移动到了边界外面
  bullets = bullets.filter(isInField)
  yield put({ type: A.SET_BULLETS, bullets })

  function isInField(bullet) {
    const x = Math.round(bullet.x)
    const y = Math.round(bullet.y)
    return 0 <= x && x + BULLET_SIZE < FIELD_BSIZE * BLOCK_SIZE
      && 0 <= y && y + BULLET_SIZE < FIELD_BSIZE * BLOCK_SIZE
  }
}

export default function* bulletsSaga() {
  yield takeEvery(A.TICK, update)
  yield takeEvery(A.AFTER_TICK, afterUpdate)
}
