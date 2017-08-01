import { delay } from 'redux-saga'
import { put, take } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import { getNextId } from 'utils/common'
import stageSaga from 'sagas/stageSaga'

type Animation = {
  direction: Direction
  distance: number
  duration: number
}

function* animateTexts(textIds: TextId[], { direction, distance: totalDistance, duration }: Animation) {
  const speed = totalDistance / duration
  // 累计移动的距离
  let animatedDistance = 0
  while (true) {
    const { delta }: Action.TickAction = yield take('TICK')
    // 本次TICK中可以移动的距离
    const len = delta * speed
    const distance = len + animatedDistance < totalDistance ? len : totalDistance - animatedDistance
    yield put({
      type: 'UPDATE_TEXT_POSITION',
      textIds,
      direction,
      distance,
    })
    animatedDistance += distance
    if (animatedDistance >= totalDistance) {
      return
    }
  }
}

// 播放游戏结束的动画
function* animateGameover() {
  const textId1 = getNextId('text')
  const textId2 = getNextId('text')
  yield put({
    type: 'SET_TEXT',
    textId: textId1,
    content: 'game',
    fill: 'red',
    x: BLOCK_SIZE * 6.5,
    y: BLOCK_SIZE * 13,
  })
  yield put({
    type: 'SET_TEXT',
    textId: textId2,
    content: 'over',
    fill: 'red',
    x: BLOCK_SIZE * 6.5,
    y: BLOCK_SIZE * 13.5,
  })
  yield* animateTexts([textId1, textId2], {
    direction: 'up',
    distance: BLOCK_SIZE * 6,
    duration: 2000,
  })
  yield delay(500)
  yield put({ type: 'REMOVE_TEXT', textId: textId1 })
  yield put({ type: 'REMOVE_TEXT', textId: textId2 })
  yield put({ type: 'SHOW_OVERLAY', overlay: 'gameover' })
}

interface StageResult {
  status: 'clear' | 'fail'
  reason?: string
}

/**
 *  game-saga负责管理整体游戏进度
 *  负责管理游戏开始界面, 游戏结束界面, 游戏暂停
 *  game-stage调用stage-saga来运行不同的关卡
 *  并根据stage-saga返回的结果选择继续下一个关卡, 或是选择游戏结束
 */
export default function* gameManager() {
  // yield fork(watchGameover)

  const stages = ['1', '2', '3']
  for (const stageName of stages) {
    const stageResult: StageResult = yield* stageSaga(stageName)
    if (stageResult.status === 'clear') {
      // continue to next stage
    } else {
      console.log(`gameover, reason: ${stageResult.reason}`)
      yield* animateGameover()
    }
  }

  // clear all stages
  // yield* animateClearance()
}
