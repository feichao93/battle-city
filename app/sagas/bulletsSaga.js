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
  DOWN,
} from 'utils/constants'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

function isBulletInField(bullet) {
  return 0 <= bullet.x && bullet.x + BULLET_SIZE < FIELD_SIZE
    && 0 <= bullet.y && bullet.y + BULLET_SIZE < FIELD_SIZE
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

function* filterBulletsCollidedWithBricks(bullets) {
  const bricks = yield select(selectors.map.bricks)

  const N = N_MAP.BRICK
  const itemSize = ITEM_SIZE_MAP.BRICK
  return bullets.filter((bullet) => {
    const col1 = Math.floor(bullet.x / itemSize)
    const col2 = Math.floor((bullet.x + BULLET_SIZE) / itemSize)
    const row1 = Math.floor(bullet.y / itemSize)
    const row2 = Math.floor((bullet.y + BULLET_SIZE) / itemSize)
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * N + col
        if (bricks.get(t)) {
          return true
        }
      }
    }
    return false
  }).toSet()
}

function* filterBulletsCollidedWithSteels(bullets) {
  const steels = yield select(selectors.map.steels)

  const N = N_MAP.STEEL
  const itemSize = ITEM_SIZE_MAP.STEEL
  return bullets.filter((bullet) => {
    const col1 = Math.floor(bullet.x / itemSize)
    const col2 = Math.floor((bullet.x + BULLET_SIZE) / itemSize)
    const row1 = Math.floor(bullet.y / itemSize)
    const row2 = Math.floor((bullet.y + BULLET_SIZE) / itemSize)
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * N + col
        if (steels.get(t)) {
          return true
        }
      }
    }
    return false
  }).toSet()
}

const BULLET_EXPLOSION_SPREAD = 4
function spreadBullet(bullet) {
  const object = { x: bullet.x, y: bullet.y, width: BULLET_SIZE, height: BULLET_SIZE }
  if (bullet.direction === UP || bullet.direction === DOWN) {
    object.x -= BULLET_EXPLOSION_SPREAD
    object.width += 2 * BULLET_EXPLOSION_SPREAD
  } else {
    object.y -= BULLET_EXPLOSION_SPREAD
    object.height += 2 * BULLET_EXPLOSION_SPREAD
  }
  return object
}

function* destroySteels(collidedBullets) {
  const steels = yield select(selectors.map.steels)
  const steelsNeedToDestroy = []
  const itemSize = ITEM_SIZE_MAP.STEEL
  const N = N_MAP.STEEL

  collidedBullets.forEach((bullet) => {
    // if (bullet.power >= 3) todo bullet必须满足一定条件才能摧毁steel
    const { x, y, width, height } = spreadBullet(bullet)

    const col1 = Math.floor(x / itemSize)
    const col2 = Math.floor((x + width) / itemSize)
    const row1 = Math.floor(y / itemSize)
    const row2 = Math.floor((y + height) / itemSize)
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * N + col
        if (steels.get(t)) {
          steelsNeedToDestroy.push(t)
        }
      }
    }
  })

  if (steelsNeedToDestroy.length > 0) {
    yield put({
      type: A.DESTROY_STEELS,
      ts: Set(steelsNeedToDestroy),
    })
  }
}

function* destroyBricks(collidedBullets) {
  const bricks = yield select(selectors.map.bricks)
  const bricksNeedToDestroy = []
  const itemSize = ITEM_SIZE_MAP.BRICK
  const N = N_MAP.BRICK

  collidedBullets.forEach((bullet) => {
    const { x, y, width, height } = spreadBullet(bullet)

    const col1 = Math.floor(x / itemSize)
    const col2 = Math.floor((x + width) / itemSize)
    const row1 = Math.floor(y / itemSize)
    const row2 = Math.floor((y + height) / itemSize)
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * N + col
        if (bricks.get(t)) {
          bricksNeedToDestroy.push(t)
        }
      }
    }
  })

  if (bricksNeedToDestroy.length > 0) {
    yield put({
      type: A.DESTROY_BRICKS,
      ts: Set(bricksNeedToDestroy),
    })
  }
}

function* afterUpdate() {
  const bullets = yield select(selectors.bullets)
  // todo 判断是否有和其他坦克相撞
  // todo 判断是否有和其他子弹相撞

  const set1 = yield* filterBulletsCollidedWithBricks(bullets)
  const set2 = yield* filterBulletsCollidedWithSteels(bullets)

  const collidedBullets = set1.union(set2)

  if (!collidedBullets.isEmpty()) {
    yield put({
      type: A.DESTROY_BULLETS,
      bullets: collidedBullets,
    })

    yield* destroyBricks(collidedBullets)
    yield* destroySteels(collidedBullets)
  }

  // 移除在边界外面的子弹
  yield put({
    type: A.DESTROY_BULLETS,
    bullets: bullets.filterNot(isBulletInField)
  })
}

let nextExplosionId = 1

export default function* bulletsSaga() {
  yield takeEvery(A.TICK, update)
  yield takeEvery(A.AFTER_TICK, afterUpdate)

  yield takeEvery(A.DESTROY_BULLETS, function* spawnExplosion({ bullets }) {
    yield* bullets.map(b => put({
      type: A.SPAWN_EXPLOSION,
      x: b.x - 6,
      y: b.y - 6,
      explosionType: 'bullet',
      explosionId: nextExplosionId++, // eslint-disable-line no-plusplus
    })).toArray()
  })
}
