import { all, put } from 'redux-saga/effects'
import { ExplosionRecord, ScoreRecord, TankRecord, TanksMap } from '../../types'
import { frame as f, getNextId } from '../../utils/common'
import { TANK_KILL_SCORE_MAP } from '../../utils/constants'
import Timing from '../../utils/Timing'

export function* scoreFromKillTank(tank: TankRecord) {
  const scoreId: ScoreId = getNextId('score')
  try {
    yield put<Action.AddScoreAction>({
      type: 'ADD_SCORE',
      score: new ScoreRecord({
        score: TANK_KILL_SCORE_MAP[tank.level],
        scoreId,
        x: tank.x,
        y: tank.y,
      }),
    })
    yield Timing.delay(f(48))
  } finally {
    yield put<Action.RemoveScoreAction>({
      type: 'REMOVE_SCORE',
      scoreId,
    })
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
    yield* tankExplosionShapeTiming.iter(function*(shape) {
      yield put<Action.AddOrUpdateExplosion>({
        type: 'ADD_OR_UPDATE_EXPLOSION',
        explosion: new ExplosionRecord({
          cx: tank.x + 8,
          cy: tank.y + 8,
          shape,
          explosionId,
        }),
      })
    })
  } finally {
    yield put<Action.RemoveExplosionAction>({
      type: 'REMOVE_EXPLOSION',
      explosionId,
    })
  }
}

export function* destroyTank(tank: TankRecord) {
  // 移除坦克
  yield put({
    type: 'REMOVE_TANK',
    tankId: tank.tankId,
  })

  // 产生坦克爆炸效果
  yield* explosionFromTank(tank)
  if (tank.side === 'ai') {
    yield* scoreFromKillTank(tank)
  }
}

// 移除坦克 & 产生爆炸效果 & 显示击杀得分信息
export default function* destroyTanks(tanks: TanksMap) {
  yield all(
    tanks
      .valueSeq()
      .map(destroyTank)
      .toArray(),
  )
}
