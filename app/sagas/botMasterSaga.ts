import { actionChannel, fork, put, select, take } from 'redux-saga/effects'
import { State } from '../reducers'
import { TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { getNextId } from '../utils/common'
import { AI_SPAWN_SPEED_MAP, TANK_INDEX_THAT_WITH_POWER_UP } from '../utils/constants'
import * as selectors from '../utils/selectors'
import botSaga from './BotSaga'
import { spawnTank } from './common'

function* addBotHelper() {
  const reqChannel = yield actionChannel(A.ReqAddBot)

  while (true) {
    yield take(reqChannel)
    const { game, stages }: State = yield select()
    if (!game.remainingEnemies.isEmpty()) {
      const { x, y } = yield select(selectors.availableSpawnPosition)
      yield put(actions.removeFirstRemainingEnemy())
      const level = game.remainingEnemies.first()
      const hp = level === 'armor' ? 4 : 1
      const tank = new TankRecord({
        tankId: getNextId('tank'),
        x,
        y,
        side: 'bot',
        level,
        hp,
        withPowerUp: TANK_INDEX_THAT_WITH_POWER_UP.includes(20 - game.remainingEnemies.count()),
        frozenTimeout: game.AIFrozenTimeout,
      })
      const difficulty = stages.find(s => s.name === game.currentStageName).difficulty
      const spawnSpeed = AI_SPAWN_SPEED_MAP[difficulty]
      yield spawnTank(tank, spawnSpeed)
      yield fork(botSaga, tank.tankId)
    }
  }
}

export default function* botMasterSaga() {
  const inMultiPlayersMode = yield select(selectors.isInMultiPlayersMode)
  const maxBotCount = inMultiPlayersMode ? 4 : 2

  yield fork(addBotHelper)

  while (true) {
    yield take(A.StartStage)
    for (let i = 0; i < maxBotCount; i++) {
      yield put(actions.reqAddBot())
    }
  }
}
