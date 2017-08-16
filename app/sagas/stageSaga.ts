import { Map } from 'immutable'
import { delay } from 'redux-saga'
import { put, select, take } from 'redux-saga/effects'
import { State } from 'reducers/index'

const tankLevels: TankLevel[] = ['basic', 'fast', 'power', 'armor']

function* statistics() {
  yield put<Action>({ type: 'LOAD_SCENE', scene: 'statistics' })

  const { game: { killInfo } }: State = yield select()

  const player1KillInfo = killInfo.get('player-1', Map<TankLevel, KillCount>())

  // todo 目前只考虑player-1的信息

  yield delay(500)

  for (const tankLevel of tankLevels) {
    const { game: { transientKillInfo } }: State = yield select()

    yield delay(250)
    const levelKillCount = player1KillInfo.get(tankLevel, 0)
    if (levelKillCount === 0) {
      yield put<Action>({
        type: 'UPDATE_TRANSIENT_KILL_INFO',
        info: transientKillInfo.setIn(['player-1', tankLevel], 0),
      })
    } else {
      for (let count = 1; count <= levelKillCount; count += 1) {
        yield put<Action>({
          type: 'UPDATE_TRANSIENT_KILL_INFO',
          info: transientKillInfo.setIn(['player-1', tankLevel], count),
        })
        yield delay(160)
      }
    }
    yield delay(300)
  }
  yield delay(1000)
  yield put<Action>({ type: 'SHOW_TOTAL_KILL_COUNT' })
  yield delay(3000)
}

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡相关信息
 */
export default function* stageSaga(stageName: string) {
  yield put<Action>({ type: 'LOAD_SCENE', scene: 'game' })
  yield put<Action>({ type: 'LOAD_STAGE', name: stageName })

  while (true) {
    const { sourcePlayer, targetTank }: Action.KillAction = yield take('KILL')
    const { players, game: { remainingEnemies }, tanks }: State = yield select()

    if (sourcePlayer.side === 'human') { // human击杀ai
      // 对human player的击杀信息进行统计
      yield put<Action>({
        type: 'INC_KILL_COUNT',
        playerName: sourcePlayer.playerName,
        level: targetTank.level,
      })

      if (remainingEnemies.isEmpty()
        && tanks.filter(t => t.side === 'ai').isEmpty()) {
        // 剩余enemy数量为0, 且场上已经没有ai tank了
        yield delay(6000)
        yield* statistics()
        return { status: 'clear' }
      }
    } else { // ai击杀human
      if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
        // 所有的human player都挂了
        yield delay(6000)
        yield* statistics()
        return { status: 'fail', reason: 'all-human-dead' }
      }
    }
  }
}
