import { actionChannel, fork, put, select, take } from 'redux-saga/effects'
import { State } from '../reducers'
import { TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { getNextId } from '../utils/common'
import { AI_SPAWN_SPEED_MAP, TANK_INDEX_THAT_WITH_POWER_UP } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import botSaga from './BotSaga'
import { spawnTank } from './common'

function* addBotHelper() {
  const reqChannel = yield actionChannel(A.ReqAddBot)

  try {
    while (true) {
      yield take(reqChannel)
      const { game, stages }: State = yield select()
      if (!game.remainingBots.isEmpty()) {
        let spawnPos: Point = yield select(selectors.availableSpawnPosition)
        while (spawnPos == null) {
          yield Timing.delay(200)
          spawnPos = yield select(selectors.availableSpawnPosition)
        }
        yield put(actions.removeFirstRemainingBot())
        const level = game.remainingBots.first()
        const hp = level === 'armor' ? 4 : 1
        const tank = new TankRecord({
          tankId: getNextId('tank'),
          x: spawnPos.x,
          y: spawnPos.y,
          side: 'bot',
          level,
          hp,
          withPowerUp: TANK_INDEX_THAT_WITH_POWER_UP.includes(20 - game.remainingBots.count()),
          frozenTimeout: game.botFrozenTimeout,
        })
        const difficulty = stages.find(s => s.name === game.currentStageName).difficulty
        const spawnSpeed = AI_SPAWN_SPEED_MAP[difficulty]
        yield put(actions.setIsSpawningBotTank(true))
        yield spawnTank(tank, spawnSpeed)
        yield put(actions.setIsSpawningBotTank(false))
        yield fork(botSaga, tank.tankId)
      }
    }
  } finally {
    yield put(actions.setIsSpawningBotTank(false))
    reqChannel.close()
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
