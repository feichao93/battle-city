import { all, put } from 'redux-saga/effects'
import { BulletRecord, BulletsMap, ExplosionRecord } from '../../types'
import * as actions from '../../utils/actions'
import { frame as f, getNextId } from '../../utils/common'
import Timing from '../../utils/Timing'

function* explosionFromBullet(bullet: BulletRecord) {
  const bulletExplosionShapeTiming: [ExplosionShape, number][] = [
    ['s0', f(4)],
    ['s1', f(3)],
    ['s2', f(2)],
  ]

  const explosionId = getNextId('explosion')
  try {
    for (const [shape, time] of bulletExplosionShapeTiming) {
      yield put(
        actions.setExplosion(
          new ExplosionRecord({
            cx: bullet.x + 2,
            cy: bullet.y + 2,
            shape,
            explosionId,
          }),
        ),
      )
      yield Timing.delay(time)
    }
  } finally {
    yield put(actions.removeExplosion(explosionId))
  }
}

/** 移除单个子弹, 调用explosionFromBullet来生成子弹爆炸(并在之后移除子弹爆炸效果) */
function* destroyBullet(bullet: BulletRecord, useExplosion: boolean) {
  // if (bullet.side === 'player') {
  //  // TODO soundManager.explosion_2()
  // }
  yield put(actions.beforeRemoveBullet(bullet.bulletId))
  yield put(actions.removeBullet(bullet.bulletId))
  if (useExplosion) {
    yield explosionFromBullet(bullet)
  }
}

/** 调用destroyBullet并使用ALL effects, 来同时移除若干个子弹 */
export default function* destroyBullets(bullets: BulletsMap, useExplosion: boolean) {
  if (!bullets.isEmpty()) {
    yield all(
      bullets
        .toIndexedSeq()
        .toArray()
        .map(bullet => destroyBullet(bullet, useExplosion)),
    )
  }
}
