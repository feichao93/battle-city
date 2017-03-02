import * as R from 'ramda'
import { takeEvery } from 'redux-saga'
import { put, select } from 'redux-saga/effects'
import { BULLET_SIZE, FIELD_BSIZE, BLOCK_SIZE, DIRECTION_MAP, ITEM_SIZE_MAP } from 'utils/constants'
import { testCollide } from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

function* update({ delta }) {
  const bullets = yield select(selectors.bullets)
  const updatedBullets = bullets.map((bullet) => {
    const { direction, speed } = bullet
    const distance = speed * delta
    const [xy, incdec] = DIRECTION_MAP[direction]
    return bullet.update(xy, incdec === 'inc' ? R.add(distance) : R.subtract(R.__, distance))
  })
  yield put({ type: A.UPDATE_BULLETS, updatedBullets })
}

function* afterUpdate() {
  const bullets = yield select(selectors.bullets)
  // todo 判断是否有和其他坦克相撞
  // todo 判断是否有和其他子弹相撞

  // 判断是否有和brickWall/steelWall等物体碰撞
  const bricks = yield select(selectors.map.bricks)
  const out1 = bullets.filter(bullet => testCollide({
    x: bullet.x,
    y: bullet.y,
    width: BULLET_SIZE,
    height: BULLET_SIZE,
  }, ITEM_SIZE_MAP.BRICK, bricks))
  if (!out1.isEmpty()) {
    yield put({ type: A.DESTROY_BULLETS, bullets: out1 })
  }

  const steels = yield select(selectors.map.steels)
  const out2 = bullets.filter(bullet => testCollide({
    x: bullet.x,
    y: bullet.y,
    width: BULLET_SIZE,
    height: BULLET_SIZE,
  }, ITEM_SIZE_MAP.STEEL, steels))
  if (!out2.isEmpty()) {
    yield put({ type: A.DESTROY_BULLETS, bullets: out2 })
  }

  // 判断是否移动到了边界外面
  const outBullets = bullets.filterNot(isInField)
  yield put({ type: A.DESTROY_BULLETS, bullets: outBullets })

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
