import { race, select } from 'little-saga/compat'
import { State } from '../reducers'
import { TankFireInfo } from '../types'
import TankRecord from '../types/TankRecord'
import { waitFor } from '../utils/common'
import { SIMPLE_FIRE_LOOP_INTERVAL } from '../utils/constants'
import * as selectors from '../utils/selectors'
import Timing from '../utils/Timing'
import values from '../utils/values'
import AITankCtx from './AITankCtx'
import { determineFire, getEnv } from './env-utils'

export default function* simpleFireLoop(ctx: AITankCtx) {
  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
      yield race({
        timeout: Timing.delay(tank ? values.bulletInterval(tank) : SIMPLE_FIRE_LOOP_INTERVAL),
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
