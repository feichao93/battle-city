import { channel as makeChannel, Task } from 'redux-saga'
import { fork, put, select, spawn, take } from 'redux-saga/effects'
import { getNextId } from 'utils/common'
import { spawnTank } from 'sagas/common'
import { TANK_INDEX_THAT_WITH_POWER_UP } from 'utils/constants'
import * as selectors from 'utils/selectors'
import { State } from 'reducers'
import { PlayerRecord, TankRecord } from 'types'
import AIWorkerSaga from '../ai/AIWorkerSaga'

/** AIMasterSaga用来管理AIWorkerSaga的启动和停止, 并处理和AI程序的数据交互 */
export default function* AIMasterSaga() {
  // const max = 2
  const max = 1
  const taskMap = new Map<PlayerName, Task>()
  const addAICommandChannel = makeChannel<'add'>()

  yield fork(addAIHandler)

  while (true) {
    const actionTypes: ActionType[] = ['KILL', 'START_STAGE', 'GAMEOVER']
    const action: Action = yield take(actionTypes)
    if (action.type === 'START_STAGE') {
      for (let i = 0; i < max; i++) {
        addAICommandChannel.put('add')
      }
    } else if (action.type === 'KILL' && action.targetTank.side === 'ai') {
      const { targetPlayer: { playerName } } = action
      // ai-player的坦克被击毁了
      const task = taskMap.get(playerName)
      task.cancel()
      taskMap.delete(action.targetPlayer.playerName)
      yield put<Action.DeactivatePlayer>({ type: 'DEACTIVATE_PLAYER', playerName })
      addAICommandChannel.put('add')
    } else if (action.type === 'GAMEOVER') {
      // 游戏结束时, 取消所有的ai-player
      for (const [playerName, task] of taskMap.entries()) {
        task.cancel()
        yield put<Action.DeactivatePlayer>({ type: 'DEACTIVATE_PLAYER', playerName })
      }
      taskMap.clear()
    }
  }

  function* addAIHandler() {
    while (true) {
      yield take(addAICommandChannel)
      const { game: { remainingEnemies, currentStage } }: State = yield select()
      if (!remainingEnemies.isEmpty()) {
        const playerName = `AI-${getNextId('AI-player')}`
        yield put<Action>({
          type: 'CREATE_PLAYER',
          player: new PlayerRecord({
            playerName,
            lives: Infinity,
            side: 'ai',
          }),
        })
        const { x, y } = yield select(selectors.availableSpawnPosition)
        yield put<Action>({ type: 'REMOVE_FIRST_REMAINING_ENEMY' })
        const level = remainingEnemies.first()
        const hp = level === 'armor' ? 4 : 1
        const tankId = yield* spawnTank(
          new TankRecord({
            x,
            y,
            side: 'ai',
            level,
            hp,
            withPowerUp: TANK_INDEX_THAT_WITH_POWER_UP.includes(20 - remainingEnemies.count()),
          }),
          0.6,
        ) // TODO 要根据关卡的难度来确定坦克的生成速度

        const task = yield spawn(AIWorkerSaga, playerName)
        taskMap.set(playerName, task)

        yield put<Action.ActivatePlayer>({
          type: 'ACTIVATE_PLAYER',
          playerName,
          tankId,
        })
      }
    }
  }
}
