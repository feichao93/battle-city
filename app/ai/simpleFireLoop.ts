import { State } from 'reducers'
import { put, race, select } from 'redux-saga/effects'
import { TankFireInfo } from 'types'
import { waitFor } from 'utils/common'
import * as selectors from 'utils/selectors'
import { determineFire, getEnv } from './AI-utils'
import { AITankCtx } from './AIWorkerSaga'
import { nonPauseDelay } from '../sagas/common'

export default function* simpleFireLoop(ctx: AITankCtx) {
  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      yield race({
        timeout: nonPauseDelay(300),
        bulletComplete: waitFor(ctx.noteEmitter, 'bullet-complete'),
      })
    }

    let tank = yield select(selectors.playerTank, ctx.playerName)
    if (tank == null) {
      continue
    }
    const fireInfo: TankFireInfo = yield select(selectors.fireInfo, ctx.playerName)
    if (fireInfo.canFire) {
      const { map, tanks }: State = yield select()

      const env = getEnv(map, tanks, tank)
      if (determineFire(tank, env)) {
        yield put<AICommand>(ctx.commandChannel, { type: 'fire' })
        yield nonPauseDelay(500)
      }
    }
  }
}
