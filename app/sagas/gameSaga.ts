import { replace } from 'react-router-redux'
import { put, takeEvery, race } from 'redux-saga/effects'
import { BLOCK_SIZE } from 'utils/constants'
import { getNextId } from 'utils/common'
import { stageNames } from 'stages'
import stageSaga, { StageResult } from 'sagas/stageSaga'
import { nonPauseDelay } from 'sagas/common'
import humanPlayerSaga from 'sagas/humanPlayerSaga'
import AIMasterSaga from 'sagas/AIMasterSaga'
import bulletsSaga from 'sagas/bulletsSaga'
import animateTexts from 'sagas/common/animateTexts'
import powerUpManager from 'sagas/powerUpManager'

// 播放游戏结束的动画
function* animateGameover() {
  const textId1 = getNextId('text')
  const textId2 = getNextId('text')
  yield put<Action>({
    type: 'SET_TEXT',
    textId: textId1,
    content: 'game',
    fill: 'red',
    x: BLOCK_SIZE * 6.5,
    y: BLOCK_SIZE * 13,
  })
  yield put<Action>({
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
  yield nonPauseDelay(500)
  yield put<Action>({ type: 'REMOVE_TEXT', textId: textId1 })
  yield put<Action>({ type: 'REMOVE_TEXT', textId: textId2 })
}

// TODO refactor
/** @deprecated 清理的逻辑应该放在对应的saga的finally block中 */
function* clear() {
  yield put<Action>({ type: 'CLEAR_BULLETS' })
  yield put<Action>({ type: 'CLEAR_TANKS' })
  yield put<Action>({ type: 'CLEAR_AI_PLAYERS' })
}

function* stageFlow(startStageIndex: number) {
  for (const name of stageNames.slice(startStageIndex)) {
    const stageResult: StageResult = yield stageSaga(name)
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
export default function* gameSaga({ stageIndex }: Action.GameStart) {
  yield takeEvery(['END_STAGE', 'GAMEOVER'], clear)

  DEV.LOG && console.log('game-start')
  yield race<any>([
    humanPlayerSaga('player-1', 'yellow'),
    AIMasterSaga(),
    powerUpManager(),
    bulletsSaga(),
    // 上面几个 saga 在一个 gameSaga 的生命周期内被认为是后台服务
    // 当 stage-flow 退出的时候，自动取消上面几个后台服务
    stageFlow(stageIndex),
  ])

  yield animateGameover()
  DEV.LOG && console.log('gameover')

  yield put(replace('/'))
  yield put<Action>({ type: 'BEFORE_GAMEOVER' })
  yield put<Action>({ type: 'GAMEOVER' })

  // TODO 处理被 cancel 的情况
}
