import AIWorkerSaga from 'ai/AIWorkerSaga'
import _ from 'lodash'
import { State } from 'reducers'
import { channel as makeChannel } from 'redux-saga'
import { fork, race, put, select, take, all } from 'redux-saga/effects'
import { spawnTank } from 'sagas/common'
import { PlayerRecord, TankRecord } from 'types'
import { getNextId } from 'utils/common'
import { TANK_INDEX_THAT_WITH_POWER_UP } from 'utils/constants'
import * as selectors from 'utils/selectors'

const max = DEV.SINGLE_AI_TANK ? 1 : 3

/** AIMasterSaga用来管理AIWorkerSaga的启动和停止, 并处理和AI程序的数据交互 */
export default function* AIMasterSaga() {
  const addChannel = makeChannel()
  yield fork(addWorker)

  while (true) {
    yield take('START_STAGE')
    for (const i in _.range(0, max)) {
      addChannel.put('add')
    }
  }

  function* addWorker() {
    while (true) {
      yield take(addChannel)
      const { game: { remainingEnemies } }: State = yield select()
      if (!remainingEnemies.isEmpty()) {
        yield fork(worker, `AI-${getNextId('AI-player')}`)
      }
    }
  }

  function* worker(playerName: string) {
    const { game: { remainingEnemies } }: State = yield select()
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
    yield race<any>([
      take(killed),
      take('GAMEOVER'),
      all([
        AIWorkerSaga(playerName),
        put<Action.ActivatePlayer>({
          type: 'ACTIVATE_PLAYER',
          playerName,
          tankId,
        }),
      ]),
    ])

    yield put<Action>({ type: 'DEACTIVATE_PLAYER', playerName })
    addChannel.put('add')

    function killed(action: Action) {
      return (
        action.type === 'KILL' &&
        action.targetTank.side === 'ai' &&
        action.targetPlayer.playerName === playerName
      )
    }
  }
}
