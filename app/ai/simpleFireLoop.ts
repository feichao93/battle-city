import { determineFire, getEnv } from 'ai/env-utils'
import { State } from 'reducers'
import { race, select } from 'redux-saga/effects'
import { nonPauseDelay } from 'sagas/common'
import { TankFireInfo } from 'types'
import * as selectors from 'utils/selectors'
import TankRecord from '../types/TankRecord'
import { getTankBulletInterval, waitFor } from '../utils/common'
import AITankCtx from './AITankCtx'

type Options = {
  defualtInterval?: number
}
export default function* simpleFireLoop(ctx: AITankCtx, options?: Options) {
  const { defualtInterval = 300 } = options || {}

  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
      yield race({
        timeout: nonPauseDelay(tank ? getTankBulletInterval(tank) : defualtInterval),
        bulletComplete: waitFor(ctx.noteEmitter, 'bullet-complete'),
      })
    }

    const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
    if (tank == null) {
      continue
    }
    const fireInfo: TankFireInfo = yield select(selectors.fireInfo, ctx.playerName)
    if (fireInfo.canFire) {
      const { map, tanks }: State = yield select()

      const env = getEnv(map, tanks, tank)
      if (determineFire(tank, env)) {
        ctx.fire()
      }
    }
  }
}
