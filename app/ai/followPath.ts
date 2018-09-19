import { put, select, take } from 'redux-saga/effects'
import { TankRecord } from '../types'
import * as actions from '../utils/actions'
import * as selectors from '../utils/selectors'
import Bot from './Bot'
import { logAI } from './logger'
import { getTankSpot } from './spot-utils'

// TODO 可以考虑「截断过长的路径」
export default function* followPath(ctx: Bot, path: number[]) {
  DEV.LOG_AI && logAI('start-follow-path')
  try {
    yield put(actions.setAITankPath(ctx.tankId, path))
    const tank: TankRecord = yield select(selectors.tank, ctx.tankId)
    DEV.ASSERT && console.assert(tank != null)
    const start = getTankSpot(tank)
    let index = path.indexOf(start)
    DEV.ASSERT && console.assert(index !== -1)

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
      yield take(ctx.noteChannel, 'reach')
    }
  } finally {
    yield put(actions.removeAITankPath(ctx.tankId))
  }
}
