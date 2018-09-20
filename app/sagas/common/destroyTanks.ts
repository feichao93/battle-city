import { put } from 'redux-saga/effects'
import { ExplosionRecord, ScoreRecord, TankRecord } from '../../types'
import * as actions from '../../utils/actions'
import { frame as f, getNextId } from '../../utils/common'
import { TANK_KILL_SCORE_MAP } from '../../utils/constants'
import Timing from '../../utils/Timing'

export function* scoreFromKillTank(tank: TankRecord) {
  const scoreId: ScoreId = getNextId('score')
  try {
    const score = new ScoreRecord({
      score: TANK_KILL_SCORE_MAP[tank.level],
      scoreId,
      x: tank.x,
      y: tank.y,
    })
    yield put(actions.addScore(score))
    yield Timing.delay(f(48))
  } finally {
    yield put(actions.removeScore(scoreId))
  }
}

const tankExplosionShapeTiming = new Timing<ExplosionShape>([
  { v: 's0', t: f(7) },
  { v: 's1', t: f(5) },
  { v: 's2', t: f(7) },
  { v: 'b0', t: f(5) },
  { v: 'b1', t: f(7) },
  { v: 's2', t: f(5) },
])
export function* explosionFromTank(tank: TankRecord) {
  const explosionId = getNextId('explosion')
  try {
    yield put(actions.playSound('explosion_1'))
    yield* tankExplosionShapeTiming.iter(function*(shape) {
      const explosion = new ExplosionRecord({
        cx: tank.x + 8,
        cy: tank.y + 8,
        shape,
        explosionId,
      })
      yield put(actions.setExplosion(explosion))
    })
  } finally {
    yield put(actions.removeExplosion(explosionId))
  }
}

export function* destroyTank(tank: TankRecord) {
  yield put(actions.setTankToDead(tank.tankId))

  yield explosionFromTank(tank)
  if (tank.side === 'bot') {
    yield scoreFromKillTank(tank)
  }
}
