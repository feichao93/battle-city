import { Map, Set as ISet } from 'immutable'
import { fork, put, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE, DOWN, ITEM_SIZE_MAP, N_MAP, SIDE, STEEL_POWER, UP } from 'utils/constants'
import {
  asBox,
  getDirectionInfo,
  getNextId,
  isInField,
  iterRowsAndCols,
  testCollide
} from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

function isBulletInField(bullet) {
  return isInField(asBox(bullet))
}

function makeExplosionFromBullet(bullet) {
  return put({
    type: A.SPAWN_EXPLOSION,
    x: bullet.x - 6,
    y: bullet.y - 6,
    explosionType: 'bullet',
    explosionId: getNextId('explosion'),
  })
}

function* handleTick() {
  while (true) {
    const { delta } = yield take(A.TICK)
    const bullets = yield select(selectors.bullets)
    if (bullets.isEmpty()) {
      continue
    }
    const updatedBullets = bullets.map((bullet) => {
      const { direction, speed } = bullet
      const distance = speed * delta
      const { xy, updater } = getDirectionInfo(direction)
      return bullet.update(xy, updater(distance))
    })
    yield put({ type: A.UPDATE_BULLETS, updatedBullets })
  }
}

function* handleBulletsCollidedWithBricks(context) {
  const bullets = yield select(selectors.bullets)
  const bricks = yield select(selectors.map.bricks)

  bullets.forEach((bullet) => {
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.BRICK, asBox(bullet))) {
      const t = row * N_MAP.BRICK + col
      if (bricks.get(t)) {
        context.expBulletIdSet.add(bullet.bulletId)
        return
      }
    }
  })
}

function* handleBulletsCollidedWithSteels(context) {
  const bullets = yield select(selectors.bullets)
  const steels = yield select(selectors.map.steels)

  bullets.forEach((bullet) => {
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.STEEL, asBox(bullet))) {
      const t = row * N_MAP.STEEL + col
      if (steels.get(t)) {
        context.expBulletIdSet.add(bullet.bulletId)
        return
      }
    }
  })
}

const BULLET_EXPLOSION_SPREAD = 4
function spreadBullet(bullet) {
  const object = asBox(bullet)
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
  collidedBullets.forEach((bullet) => {
    if (bullet.power >= STEEL_POWER) {
      for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.STEEL, spreadBullet(bullet))) {
        const t = row * N_MAP.STEEL + col
        if (steels.get(t)) {
          steelsNeedToDestroy.push(t)
        }
      }
    }
  })

  if (steelsNeedToDestroy.length > 0) {
    yield put({
      type: A.DESTROY_STEELS,
      ts: ISet(steelsNeedToDestroy),
    })
  }
}

function* destroyBricks(collidedBullets) {
  const bricks = yield select(selectors.map.bricks)
  const bricksNeedToDestroy = []

  collidedBullets.forEach((bullet) => {
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.BRICK, spreadBullet(bullet))) {
      const t = row * N_MAP.BRICK + col
      if (bricks.get(t)) {
        bricksNeedToDestroy.push(t)
      }
    }
  })

  if (bricksNeedToDestroy.length > 0) {
    yield put({
      type: A.DESTROY_BRICKS,
      ts: ISet(bricksNeedToDestroy),
    })
  }
}

function* filterBulletsCollidedWithEagle(bullets) {
  // 判断是否和eagle相撞
  const eagle = yield select(selectors.map.eagle)
  if (eagle.get('broken')) {
    return Map()
  } else {
    const eagleBox = {
      x: eagle.get('x'),
      y: eagle.get('y'),
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
    }
    return bullets.filter(bullet => testCollide(eagleBox, asBox(bullet)))
  }
}

function* handleBulletsCollidedWithTanks(context) {
  const bullets = yield select(selectors.bullets)

  // 子弹与坦克碰撞的规则
  // 1. player的子弹打到player-tank: player-tank将会停滞若干时间
  // 2. player的子弹打到AI-tank: AI-tank扣血
  // 3. AI的子弹打到player-tank: player-tank扣血/死亡
  // 4. AI的子弹达到AI-tank: 不发生任何事件
  const tanks = yield select(selectors.tanks)
  for (const bullet of bullets.values()) {
    for (const tank of tanks.values()) {
      if (tank.tankId === bullet.tankId) {
        // 如果是自己发射的子弹, 则不需要进行处理
        continue
      }
      const subject = {
        x: tank.x,
        y: tank.y,
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
      }
      if (testCollide(subject, asBox(bullet), -0.02)) {
        const bulletSide = yield select(selectors.sideOfBullet, bullet.bulletId)
        const tankSide = tank.side

        if (bulletSide === SIDE.PLAYER && tankSide === SIDE.PLAYER) {
          // todo 暂时对坦克不进行处理
          // 不发生子弹爆炸
          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === SIDE.PLAYER && tankSide === SIDE.AI) {
          context.hurtedTankIds.add(tank.tankId)
          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === SIDE.AI && tankSide === SIDE.PLAYER) {
          context.hurtedTankIds.add(tank.tankId)
          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === SIDE.AI && tankSide === SIDE.AI) {
          // 坦克什么事也不发生
          context.noExpBulletIdSet.add(bullet.bulletId)
        } else {
          throw new Error('Error side status')
        }
      }
    }
  }
}

function* handleBulletsCollidedWithBullets(context) {
  const bullets = yield select(selectors.bullets)
  for (const bullet of bullets.values()) {
    const subject = asBox(bullet)
    for (const other of bullets.values()) {
      if (bullet.bulletId === other.bulletId) {
        continue
      }
      const object = asBox(other)
      if (testCollide(subject, object)) {
        context.noExpBulletIdSet.add(bullet.bulletId)
      }
    }
  }
}

function* handleAfterTick() {
  while (true) {
    yield take(A.AFTER_TICK)
    const bullets = yield select(selectors.bullets)

    const bulletsCollidedWithEagle = yield* filterBulletsCollidedWithEagle(bullets)
    if (!bulletsCollidedWithEagle.isEmpty()) {
      yield put({
        type: A.DESTROY_BULLETS,
        bullets: bulletsCollidedWithEagle,
        spawnExplosion: true,
      })
      yield put({ type: A.DESTROY_EAGLE })
      // DESTROY_EAGLE被dispatch之后将会触发游戏失败的流程
    }

    // 新建一个统计对象(context), 用来存放这一个tick中的统计信息
    // 注意这里的Set是ES2015的原生Set
    const context = {
      // 将要爆炸的子弹的id集合
      expBulletIdSet: new Set(),
      // 不需要爆炸的子弹的id集合
      noExpBulletIdSet: new Set(),
      // 受到伤害的坦克 (假设一个tick中一架坦克最多受到一点伤害)
      hurtedTankIds: new Set(),
    }

    yield* handleBulletsCollidedWithTanks(context)
    yield* handleBulletsCollidedWithBullets(context)
    yield* handleBulletsCollidedWithBricks(context)
    yield* handleBulletsCollidedWithSteels(context)

    // 产生爆炸效果的的子弹
    const expBullets = bullets.filter(bullet => context.expBulletIdSet.has(bullet.bulletId))
    if (!expBullets.isEmpty()) {
      yield put({
        type: A.DESTROY_BULLETS,
        bullets: expBullets,
        spawnExplosion: true,
      })

      yield* destroyBricks(expBullets)
      yield* destroySteels(expBullets)
    }

    // 不产生爆炸, 直接消失的子弹
    const noExpBullets = bullets.filter(bullet => context.noExpBulletIdSet.has(bullet.bulletId))
    if (context.noExpBulletIdSet.size > 0) {
      yield put({
        type: A.DESTROY_BULLETS,
        bullets: noExpBullets,
        spawnExplosion: false,
      })
    }

    // 移除在边界外面的子弹
    const outsideBullets = bullets.filterNot(isBulletInField)
    if (!outsideBullets.isEmpty()) {
      yield put({
        type: A.DESTROY_BULLETS,
        bullets: outsideBullets,
        spawnExplosion: true,
      })
    }
  }
}

export default function* bulletsSaga() {
  yield fork(handleTick)
  yield fork(handleAfterTick)

  yield fork(function* handleDestroyBullets() {
    while (true) {
      const { bullets, spawnExplosion } = yield take(A.DESTROY_BULLETS)
      if (spawnExplosion) {
        yield* bullets.toArray().map(makeExplosionFromBullet)
      }
    }
  })
}
