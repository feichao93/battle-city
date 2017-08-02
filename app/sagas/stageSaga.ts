import { delay } from 'redux-saga'
import { put, select, take } from 'redux-saga/effects'
import { State } from 'reducers/index'

function* statistics() {
  yield put<Action>({ type: 'SHOW_OVERLAY', overlay: 'statistics' })
  // todo 在这里添加statistics的动画
  yield delay(5000)
  yield put<Action>({ type: 'REMOVE_OVERLAY', overlay: 'statistics' })
}

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-返回该关卡相关信息
 */
export default function* stageSaga(stageName: string) {
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
        yield* statistics()
        return { status: 'clear' }
      }
    } else { // ai击杀human
      if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
        // 所有的human player都挂了
        yield* statistics()
        return { status: 'fail', reason: 'all-human-dead' }
      }
    }
  }
}
