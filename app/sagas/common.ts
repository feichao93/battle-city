import { delay } from 'redux-saga'
import { put } from 'redux-saga/effects'
import { TankRecord, FlickerRecord, BulletRecord, ExplosionRecord } from 'types'
import { frame as f, getNextId } from 'utils/common'

// TODO 将flicker和add-tank的逻辑分离开来
export function* spawnTank(tank: TankRecord, spawnSpeed = 1) {
  const flickerShapeTiming: Timing<FlickerShape> = [
    [3, 3],
    [2, 3],
    [1, 3],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [2, 3],
    [1, 3],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 1],
  ]

  const flickerId = getNextId('flicker')

  for (const [shape, time] of flickerShapeTiming) {
    yield put<Action.AddOrUpdateFlickerAction>({
      type: 'ADD_OR_UPDATE_FLICKER',
      flicker: FlickerRecord({
        flickerId,
        x: tank.x,
        y: tank.y,
        shape,
      }),
    })
    // todo 得考虑游戏暂停的情况
    yield delay(time / spawnSpeed)
  }
  yield put<Action.RemoveFlickerAction>({ type: 'REMOVE_FLICKER', flickerId })

  const tankId = getNextId('tank')
  yield put({
    type: 'ADD_TANK',
    tank: tank.set('tankId', tankId),
  })
  return tankId
}

export function* explosionFromBullet(bullet: BulletRecord) {
  const bulletExplosionShapeTiming: [ExplosionShape, number][] = [
    ['s0', f(4)],
    ['s1', f(3)],
    ['s2', f(2)],
  ]

  const explosionId = getNextId('explosion')
  for (const [shape, time] of bulletExplosionShapeTiming) {
    yield put<Action.AddOrUpdateExplosion>({
      type: 'ADD_OR_UPDATE_EXPLOSION',
      explosion: ExplosionRecord({
        cx: bullet.x + 2,
        cy: bullet.y + 2,
        shape,
        explosionId,
      }),
    })
    yield delay(time) // TODO 考虑PAUSE的情况
  }

  yield put<Action.RemoveExplosionAction>({
    type: 'REMOVE_EXPLOSION',
    explosionId,
  })
}

export function* explosionFromTank(tank: TankRecord) {
  const tankExplosionShapeTiming: Timing<ExplosionShape> = [
    ['s0', f(7)],
    ['s1', f(5)],
    ['s2', f(7)],
    ['b0', f(5)],
    ['b1', f(7)],
    ['s2', f(5)],
  ]

  const explosionId = getNextId('explosion')
  for (const [shape, time] of tankExplosionShapeTiming) {
    yield put<Action.AddOrUpdateExplosion>({
      type: 'ADD_OR_UPDATE_EXPLOSION',
      explosion: ExplosionRecord({
        cx: tank.x + 8,
        cy: tank.y + 8,
        shape,
        explosionId,
      }),
    })
    yield delay(time) // TODO 考虑PAUSE的情况
  }

  yield put<Action.RemoveExplosionAction>({
    type: 'REMOVE_EXPLOSION',
    explosionId,
  })
}
