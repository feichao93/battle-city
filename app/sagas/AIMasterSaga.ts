import { actionChannel, fork, put, select, take } from 'redux-saga/effects'
import { State } from '../reducers'
import { TankRecord } from '../types'
import { getNextId } from '../utils/common'
import {
  AI_SPAWN_SPEED_MAP,
  MAX_AI_TANK_COUNT,
  TANK_INDEX_THAT_WITH_POWER_UP,
} from '../utils/constants'
import * as selectors from '../utils/selectors'
import AIPlayer from './AIPlayer'
import { spawnTank } from './common'

function* addAIHandler() {
  const reqChannel = yield actionChannel('REQ_ADD_AI_PLAYER')
  while (true) {
    yield take(reqChannel)
    const { game, stages }: State = yield select()
    if (!game.remainingEnemies.isEmpty()) {
      const { x, y } = yield select(selectors.availableSpawnPosition)
      yield put<Action>({ type: 'REMOVE_FIRST_REMAINING_ENEMY' })
      const level = game.remainingEnemies.first()
      const hp = level === 'armor' ? 4 : 1
      const tank = new TankRecord({
        tankId: getNextId('tank'),
        x,
        y,
        side: 'ai',
        level,
        hp,
        withPowerUp: TANK_INDEX_THAT_WITH_POWER_UP.includes(20 - game.remainingEnemies.count()),
        frozenTimeout: game.AIFrozenTimeout,
      })
      const difficulty = stages.find(s => s.name === game.currentStageName).difficulty
      const spawnSpeed = AI_SPAWN_SPEED_MAP[difficulty]
      yield spawnTank(tank, spawnSpeed)
      yield fork(AIPlayer, `AI-${getNextId('AI-player')}`, tank.tankId)
    }
  }
}

export default function* AIMasterSaga() {
  yield fork(addAIHandler)

  while (true) {
    yield take('START_STAGE')
    for (let i = 0; i < MAX_AI_TANK_COUNT; i++) {
      yield put<Action>({ type: 'REQ_ADD_AI_PLAYER' })
    }
  }
}
