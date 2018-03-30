import { replace } from 'react-router-redux'
import { delay } from 'redux-saga'
import { put, race, select, take } from 'redux-saga/effects'
import AIMasterSaga from 'sagas/AIMasterSaga'
import bulletsSaga from 'sagas/bulletsSaga'
import animateTexts from 'sagas/common/animateTexts'
import humanPlayerSaga from 'sagas/humanPlayerSaga'
import powerUpManager from 'sagas/powerUpManager'
import stageSaga, { StageResult } from 'sagas/stageSaga'
import { concat } from 'sagas/helper'
import { getNextId } from 'utils/common'
import { BLOCK_SIZE } from 'utils/constants'
import TextRecord from 'types/TextRecord'
import { State } from '../reducers'
import Timing from '../utils/Timing'

// 播放游戏结束的动画
function* animateGameover() {
  const textId1 = getNextId('text')
  const textId2 = getNextId('text')
  try {
    yield put<Action>({
      type: 'SET_TEXT',
      text: new TextRecord({
        textId: textId1,
        content: 'game',
        fill: 'red',
        x: BLOCK_SIZE * 6.5,
        y: BLOCK_SIZE * 13,
      }),
    })
    yield put<Action>({
      type: 'SET_TEXT',
      text: new TextRecord({
        textId: textId2,
        content: 'over',
        fill: 'red',
        x: BLOCK_SIZE * 6.5,
        y: BLOCK_SIZE * 13.5,
      }),
    })
    yield* animateTexts([textId1, textId2], {
      direction: 'up',
      distance: BLOCK_SIZE * 6,
      duration: 2000,
    })
    yield Timing.delay(500)
  } finally {
    yield put<Action>({ type: 'REMOVE_TEXT', textId: textId1 })
    yield put<Action>({ type: 'REMOVE_TEXT', textId: textId2 })
  }
}

function* stageFlow(startStageIndex: number) {
  const { stages }: State = yield select()
  for (const stage of stages.slice(startStageIndex)) {
    const stageResult: StageResult = yield stageSaga(stage)
    DEV.LOG && console.log('stageResult:', stageResult)
    if (!stageResult.pass) {
      break
    }
  }
}

/**
 *  game-saga负责管理整体游戏进度
 *  负责管理游戏开始界面, 游戏结束界面
 *  game-stage调用stage-saga来运行不同的关卡
 *  并根据stage-saga返回的结果选择继续下一个关卡, 或是选择游戏结束
 */
export default function* gameSaga(action: Action.StartGame | { type: 'RESET_GAME' }) {
  if (action.type === 'RESET_GAME') {
    console.log('GAME RESET')
    return
  }

  // 这里的 delay(0) 是为了「异步执行」后续的代码
  // 以保证后续代码执行前已有的cancel逻辑执行完毕
  yield delay(0)
  DEV.LOG && console.log('GAME STARTED')

  const result = yield race<any>({
    human: humanPlayerSaga('player-1', 'yellow'),
    ai: AIMasterSaga(),
    powerUp: powerUpManager(),
    bullets: bulletsSaga(),
    // 上面几个 saga 在一个 gameSaga 的生命周期内被认为是后台服务
    // 当 stage-flow 退出（或者是用户直接离开了game-scene）的时候，自动取消上面几个后台服务
    flow: concat(stageFlow(action.stageIndex), animateGameover()),
    leave: take('LEAVE_GAME_SCENE'),
  })

  if (DEV.LOG) {
    if (result.leave) {
      console.log('LEAVE GAME SCENE')
    }
  }

  if (result.flow) {
    DEV.LOG && console.log('GAME ENDED')
    yield put(replace('/gameover'))
  }
  yield put<Action>({ type: 'BEFORE_END_GAME' })
  yield put<Action>({ type: 'END_GAME' })
}
