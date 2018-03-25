import { State } from 'reducers'
import { put, select, take, cancelled } from 'redux-saga/effects'
import statistics from 'sagas/stageStatistics'
import { frame as f } from 'utils/common'
import { replace } from 'react-router-redux'
import Timing from '../utils/Timing'

function* animateCurtainAndLoadMap(stageName: string) {
  try {
    yield put<Action>({ type: 'UPDATE_COMING_STAGE_NAME', stageName })
    yield put<Action>({
      type: 'UPDATE_CURTAIN',
      curtainName: 'stage-enter-cutain',
      t: 0,
    })

    yield* Timing.tween(f(30), t =>
      put<Action>({
        type: 'UPDATE_CURTAIN',
        curtainName: 'stage-enter-cutain',
        t,
      }),
    )

    // 在幕布完全将舞台遮起来的时候载入地图
    yield Timing.delay(f(20))
    yield put<Action>({ type: 'LOAD_STAGE_MAP', name: stageName })
    yield Timing.delay(f(20))

    yield* Timing.tween(f(30), t =>
      put<Action>({
        type: 'UPDATE_CURTAIN',
        curtainName: 'stage-enter-cutain',
        t: 1 - t,
      }),
    )
    // todo 游戏开始的时候有一个 反色效果
  } finally {
    if (yield cancelled()) {
      // 将幕布隐藏起来
      yield put<Action>({
        type: 'UPDATE_CURTAIN',
        curtainName: 'stage-enter-cutain',
        t: 0,
      })
    }
  }
}

export interface StageResult {
  pass: boolean
  reason?: 'eagle-destroyed' | 'dead'
}

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡结果
 */
export default function* stageSaga(stageName: string) {
  yield put(replace(`/stage/${stageName}`))

  try {
    yield animateCurtainAndLoadMap(stageName)
    yield put<Action>({ type: 'BEFORE_START_STAGE', name: stageName })
    yield put<Action>({ type: 'SHOW_HUD' })
    yield put<Action>({ type: 'START_STAGE', name: stageName })

    while (true) {
      const action: Action = yield take(['KILL', 'DESTROY_EAGLE'])
      if (action.type === 'KILL') {
        const { sourcePlayer, targetTank } = action
        const { players, game: { remainingEnemies }, tanks }: State = yield select()

        if (sourcePlayer.side === 'human') {
          // human击杀ai
          // 对human player的击杀信息进行统计
          yield put<Action>({
            type: 'INC_KILL_COUNT',
            playerName: sourcePlayer.playerName,
            level: targetTank.level,
          })

          const otherActiveAITanks = tanks.filter(
            t => t.active && t.side === 'ai' && t.tankId !== targetTank.tankId,
          )
          if (remainingEnemies.isEmpty() && otherActiveAITanks.isEmpty()) {
            // 剩余enemy数量为0, 且场上已经没有ai tank了
            yield Timing.delay(1500)
            const { powerUps }: State = yield select()
            if (!powerUps.isEmpty()) {
              // 如果场上有powerup, 则适当延长结束时间
              yield Timing.delay(5000)
            }
            yield* statistics()
            yield put<Action>({ type: 'BEFORE_END_STAGE' })
            yield put<Action>({ type: 'END_STAGE' })
            return { pass: true } as StageResult
          }
        } else {
          // ai击杀human
          if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
            // 所有的human player都挂了
            yield Timing.delay(1500)
            yield* statistics()
            // 因为 gameSaga 会 put END_GAME 所以这里不需要 put END_STAGE
            return { pass: false, reason: 'dead' } as StageResult
          }
        }
      } else if (action.type === 'DESTROY_EAGLE') {
        // 因为 gameSaga 会 put END_GAME 所以这里不需要 put END_STAGE
        return { pass: false, reason: 'eagle-destroyed' } as StageResult
      }
    }
  } finally {
    // TODO cancel logic
    yield put<Action>({ type: 'HIDE_HUD' })
  }
}
