import { nonPauseDelay } from 'sagas/common'
import * as selectors from 'utils/selectors'
import { put, select } from 'redux-saga/effects'
import { waitFor } from 'utils/common'
import { TankRecord } from 'types'
import { AITankCtx } from 'ai/AIWorkerSaga'
import { logAI } from 'ai/logger'
import { getTankPos } from 'ai/pos-utils'

function getDirectionFromPosDiff(t1: number, t2: number): Direction {
  if (t2 === t1 + 1) return 'right'
  if (t2 === t1 - 1) return 'left'
  if (t2 === t1 + 26) return 'down'
  if (t2 === t1 - 26) return 'up'
  throw new Error('invalid direction')
}

export default function* followPath(ctx: AITankCtx, path: number[]) {
  DEV && logAI('follow-path')
  try {
    yield put<Action>({ type: 'SET_AI_TANK_PATH', playerName: ctx.playerName, path })
    const tank: TankRecord = yield select(selectors.playerTank, ctx.playerName)
    const start = getTankPos(tank)
    let index = path.indexOf(start)
    DEV && console.assert(index !== -1)

    while (index < path.length - 1) {
      const direction = getDirectionFromPosDiff(path[index], path[index + 1])
      yield put<AICommand>(ctx.commandChannel, { type: 'turn', direction })
      const delta = path[index + 1] - path[index]
      let step = 1
      while (
        index + step + 1 < path.length &&
        path[index + step + 1] - path[index + step] === delta
      ) {
        step++
      }
      yield nonPauseDelay(100)
      // TODO forwardLength不一定就是 step * 8，有可能是一个小数
      yield put<AICommand>(ctx.commandChannel, { type: 'forward', forwardLength: step * 8 })
      // TODO 需要考虑移动失败（例如碰到了障碍物）的情况
      yield waitFor(ctx.noteEmitter, 'reach')
      index += step
    }
  } finally {
    yield put<Action>({ type: 'REMOVE_AI_TANK_PATH', playerName: ctx.playerName })
  }
}
