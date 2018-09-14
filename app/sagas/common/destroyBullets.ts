import { all, put } from 'redux-saga/effects'
import { BulletRecord, BulletsMap, ExplosionRecord } from '../../types'
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
      yield put<Action.AddOrUpdateExplosion>({
        type: 'ADD_OR_UPDATE_EXPLOSION',
        explosion: new ExplosionRecord({
          cx: bullet.x + 2,
          cy: bullet.y + 2,
          shape,
          explosionId,
        }),
      })
      yield Timing.delay(time)
    }
  } finally {
    yield put<Action.RemoveExplosionAction>({
      type: 'REMOVE_EXPLOSION',
      explosionId,
    })
  }
}

/** 移除单个子弹, 调用explosionFromBullet来生成子弹爆炸(并在之后移除子弹爆炸效果) */
function* destroyBullet(bullet: BulletRecord, useExplosion: boolean) {
  // if (bullet.side === 'human') {
  //  // TODO soundManager.explosion_2()
  // }
  yield put<Action.BeforeRemoveBulletAction>({
    type: 'BEFORE_REMOVE_BULLET',
    bulletId: bullet.bulletId,
  })
  yield put<Action.RemoveBulletAction>({
    type: 'REMOVE_BULLET',
    bulletId: bullet.bulletId,
  })
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
