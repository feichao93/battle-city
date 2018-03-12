import { logAI } from 'ai/logger'
import { getTankSpot } from 'ai/spot-utils'
import { put, select } from 'redux-saga/effects'
import { TankRecord } from 'types'
import { waitFor } from 'utils/common'
import * as selectors from 'utils/selectors'
import AITankCtx from './AITankCtx'

export default function* followPath(ctx: AITankCtx, path: number[]) {
  DEV && logAI('follow-path')
  try {
    yield put<Action>({ type: 'SET_AI_TANK_PATH', playerName: ctx.playerName, path })
    const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
    DEV && console.assert(tank != null)
    const start = getTankSpot(tank)
    let index = path.indexOf(start)
    DEV && console.assert(index !== -1)

    while (index < path.length - 1) {
      const delta = path[index + 1] - path[index]
      let step = 1
      while (
        index + step + 1 < path.length &&
        path[index + step + 1] - path[index + step] === delta
      ) {
        step++
      }
      index += step
      yield* ctx.moveTo(path[index])
      // TODO 需要考虑移动失败（例如碰到了障碍物）的情况
      yield waitFor(ctx.noteEmitter, 'reach')
    }
  } finally {
    yield put<Action>({ type: 'REMOVE_AI_TANK_PATH', playerName: ctx.playerName })
  }
}
