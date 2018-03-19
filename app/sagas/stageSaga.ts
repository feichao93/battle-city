import { State } from 'reducers'
import { put, select, take } from 'redux-saga/effects'
import { nonPauseDelay, tween } from 'sagas/common'
import statistics from 'sagas/stageStatistics'
import { frame as f } from 'utils/common'
import { replace } from 'react-router-redux'

function* startStage(stageName: string) {
  yield put<Action>({
    type: 'UPDATE_COMING_STAGE_NAME',
    stageName,
  })
  yield put<Action>({
    type: 'UPDATE_CURTAIN',
    curtainName: 'stage-enter-cutain',
    t: 0,
  })

  yield* tween(f(30), t =>
    put<Action>({
      type: 'UPDATE_CURTAIN',
      curtainName: 'stage-enter-cutain',
      t,
    }),
  )
  yield nonPauseDelay(f(20))
  // 在幕布完全将舞台遮起来的时候载入地图
  yield put<Action>({
    type: 'LOAD_STAGE_MAP',
    name: stageName,
  })
  yield nonPauseDelay(f(20))
  yield* tween(f(30), t =>
    put<Action>({
      type: 'UPDATE_CURTAIN',
      curtainName: 'stage-enter-cutain',
      t: 1 - t,
    }),
  )
  // todo 游戏开始的时候有一个 反色效果

  yield put<Action.StartStage>({
    type: 'START_STAGE',
    name: stageName,
  })
}

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡相关信息
 */
export default function* stageSaga(stageName: string) {
  let shouldPutEndStage = false
  yield put(replace(`/stage/${stageName}`))

  yield* startStage(stageName)
  try {
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

          const activeAITanks = tanks.filter(t => t.active && t.side === 'ai')
          if (remainingEnemies.isEmpty() && activeAITanks.isEmpty()) {
            // 剩余enemy数量为0, 且场上已经没有ai tank了
            yield nonPauseDelay(1500)
            const { powerUps }: State = yield select()
            if (!powerUps.isEmpty()) {
              // 如果场上有powerup, 则适当延长结束时间
              yield nonPauseDelay(5000)
            }
            yield* statistics()
            shouldPutEndStage = true
            return { status: 'clear' }
          }
        } else {
          // ai击杀human
          if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
            // 所有的human player都挂了
            yield nonPauseDelay(1500)
            yield* statistics()
            shouldPutEndStage = true
            return { status: 'fail', reason: 'all-human-dead' }
          }
        }
      } else if (action.type === 'DESTROY_EAGLE') {
        return { status: 'fail', reason: 'DESTROY_EAGLE' }
      }
    }
  } finally {
    if (shouldPutEndStage) {
      yield put<Action.EndStage>({ type: 'END_STAGE' })
    }
  }
}
