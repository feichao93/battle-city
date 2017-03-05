import * as R from 'ramda'
import { Set } from 'immutable'
import { takeEvery } from 'redux-saga'
import { put, select } from 'redux-saga/effects'
import {
  BULLET_SIZE,
  DIRECTION_MAP,
  ITEM_SIZE_MAP,
  FIELD_SIZE,
  N_MAP,
  UP,
  DOWN
} from 'utils/constants'
import { testCollide, getRowCol, testCollide2 } from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

function isInField(bullet) {
  const x = Math.round(bullet.x)
  const y = Math.round(bullet.y)
  return 0 <= x && x + BULLET_SIZE < FIELD_SIZE
    && 0 <= y && y + BULLET_SIZE < FIELD_SIZE
}

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

function* handleCollisionsBetweenBulletsAndBricks(bullets) {
  // Array<[bullet_owner, brick_index]>
  const collisions = []
  const bricks = yield select(selectors.map.bricks)

  bullets.forEach((bullet) => {
    bricks.forEach((set, t) => {
      if (set) {
        const [row, col] = getRowCol(t, N_MAP.BRICK)
        const subject = { x: col * 4, y: row * 4, width: 4, height: 4 }
        const object = { x: bullet.x, y: bullet.y, width: BULLET_SIZE, height: BULLET_SIZE }
        if (testCollide2(subject, object)) {
          collisions.push([bullet, t])
        }
      }
    })
  })

  if (collisions.length > 0) {
    const collidedBullets = Set(collisions.map(R.head))
    yield put({
      type: A.DESTROY_BULLETS_BY_ONWER,
      owners: collidedBullets.map(R.prop('owner')),
    })

    const spread = 4
    const bricksNeedToDestroy = []
    collidedBullets.forEach((b) => {
      bricks.forEach((set, t) => {
        if (set) {
          const [row, col] = getRowCol(t, N_MAP.BRICK)
          const subject = { x: col * 4, y: row * 4, width: 4, height: 4 }
          const object = { x: b.x, y: b.y, width: BULLET_SIZE, height: BULLET_SIZE }
          if (b.direction === UP || b.direction === DOWN) {
            object.x -= spread
            object.width += 2 * spread
          } else {
            object.y -= spread
            object.height += 2 * spread
          }
          if (testCollide2(subject, object)) {
            bricksNeedToDestroy.push(t)
          }
        }
      })
    })
    yield put({
      type: A.DESTROY_BRICKS,
      ts: Set(bricksNeedToDestroy),
    })
  }
}

function* handleCollisionsBetweenBulletsAndSteels(bullets) {
  // 判断是否有和steel碰撞
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
}

function* afterUpdate() {
  const bullets = yield select(selectors.bullets)
  // todo 判断是否有和其他坦克相撞
  // todo 判断是否有和其他子弹相撞

  yield* handleCollisionsBetweenBulletsAndBricks(bullets)
  yield* handleCollisionsBetweenBulletsAndSteels(bullets)

  // 移除在边界外面的子弹
  yield put({
    type: A.DESTROY_BULLETS,
    bullets: bullets.filterNot(isInField)
  })
}

export default function* bulletsSaga() {
  yield takeEvery(A.TICK, update)
  yield takeEvery(A.AFTER_TICK, afterUpdate)
}
