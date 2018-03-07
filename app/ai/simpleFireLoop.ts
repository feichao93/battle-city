import { determineFire, getEnv } from 'ai/env-utils'
import { State } from 'reducers'
import { race, select } from 'redux-saga/effects'
import { nonPauseDelay } from 'sagas/common'
import { TankFireInfo } from 'types'
import * as selectors from 'utils/selectors'
import AITankCtx from './AITankCtx'

type Options = {
  interval?: number
  cooldown?: number
}
export default function* simpleFireLoop(ctx: AITankCtx, options?: Options) {
  const { interval = 300, cooldown = 500 } = options || {}

  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      yield race({
        timeout: nonPauseDelay(interval),
        // bulletComplete: waitFor(ctx.noteEmitter, 'bullet-complete'), // TODO
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
        ctx.fire()
        yield nonPauseDelay(cooldown)
      }
    }
  }
}
