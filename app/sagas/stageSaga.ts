import * as _ from 'lodash'
import { fork, put, select, take } from 'redux-saga/effects'
import { State } from 'reducers/index'
import * as selectors from 'utils/selectors'
import { frame as f, getNextId } from 'utils/common'
import { POWER_UP_NAMES } from 'utils/constants'
import { PowerUpRecord } from 'types'
import { nonPauseDelay, tween } from 'sagas/common'
import powerUp from 'sagas/powerUpSaga'
import statistics from 'sagas/stageStatistics'

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

  yield* tween(f(30), t => put<Action>({
    type: 'UPDATE_CURTAIN',
    curtainName: 'stage-enter-cutain',
    t,
  }))
  yield nonPauseDelay(f(20))
  // 在幕布完全将舞台遮起来的时候载入地图
  yield put<Action>({
    type: 'LOAD_STAGE_MAP',
    name: stageName,
  })
  yield nonPauseDelay(f(20))
  yield* tween(f(30), t => put<Action>({
    type: 'UPDATE_CURTAIN',
    curtainName: 'stage-enter-cutain',
    t: 1 - t,
  }))
  // todo 游戏开始的时候有一个 反色效果

  yield put<Action.StartStage>({
    type: 'START_STAGE',
    name: stageName,
  })
}

function* spawnPowerUp() {
  const powerUpName = _.sample(POWER_UP_NAMES)
  const position: Point = _.sample(yield select(selectors.validPowerUpSpawnPositions))
  yield* powerUp(PowerUpRecord({
    powerUpId: getNextId('power-up'),
    powerUpName,
    visible: true,
    x: position.x,
    y: position.y,
  }))
}

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡相关信息
 */
export default function* stageSaga(stageName: string) {
  yield put<Action>({ type: 'LOAD_SCENE', scene: 'game' })

  yield* startStage(stageName)

  while (true) {
    const action: Action = yield take(['KILL', 'DESTROY_EAGLE'])
    if (action.type === 'KILL') {
      const { sourcePlayer, targetTank } = action
      const { players, game: { remainingEnemies }, tanks }: State = yield select()

      if (sourcePlayer.side === 'human') { // human击杀ai
        // 对human player的击杀信息进行统计
        yield put<Action>({
          type: 'INC_KILL_COUNT',
          playerName: sourcePlayer.playerName,
          level: targetTank.level,
        })

        // TODO spawnPowerUp并不是在KILL的时候产生的, 而是在HURT的时候产生
        if (action.targetTank.withPowerUp) {
          yield fork(spawnPowerUp)
        }

        const activeAITanks = tanks.filter(t => (t.active && t.side === 'ai'))
        if (remainingEnemies.isEmpty() && activeAITanks.isEmpty()) {
          // 剩余enemy数量为0, 且场上已经没有ai tank了
          yield nonPauseDelay(1500)
          const { powerUps }: State = yield select()
          if (!powerUps.isEmpty()) {
            // 如果场上有powerup, 则适当延长结束时间
            yield nonPauseDelay(5000)
          }
          yield* statistics()
          yield put<Action.EndStage>({ type: 'END_STAGE' })
          return { status: 'clear' }
        }
      } else { // ai击杀human
        if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
          // 所有的human player都挂了
          yield nonPauseDelay(1500)
          yield* statistics()
          yield put<Action.EndStage>({ type: 'END_STAGE' })
          return { status: 'fail', reason: 'all-human-dead' }
        }
      }
    } else if (action.type === 'DESTROY_EAGLE') {
      return { status: 'fail', reason: 'DESTROY_EAGLE' }
    }
  }
}
