import { delay } from 'redux-saga'
import { fork, put, select, take } from 'redux-saga/effects'
import * as selectors from 'utils/selectors'
import { BLOCK_SIZE } from 'utils/constants'
import { getNextId, spawnTank } from 'utils/common'
import { State, TankRecord } from 'types'

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

function* watchGameover() {
  while (true) {
    yield take(['DESTROY_EAGLE', 'ALL_HUMAN_DEAD'])
    // 首先暂停所有的玩家的操作
    yield put({ type: 'DEACTIVATE_ALL_PLAYERS' })
    // 进行游戏结束动画
    yield* animateGameover()
  }
}

function* humanPlayerSaga(playerName: string) {
  yield put({
    type: 'CREATE_PLAYER',
    playerName,
    lives: 3,
  })

  while (true) {
    yield take((action: Action) => (
      action.type === 'LOAD_STAGE'
      || action.type === 'KILL' && action.targetPlayer.playerName === 'player-1'
    ))
    const { players }: State = yield select()
    const player = players.get(playerName)
    if (player.lives > 0) {
      // todo 是否可以等待一会儿 再开始生成坦克
      yield put({ type: 'DECREMENT_PLAYER_LIVE', playerName })
      const tankId = yield* spawnTank(TankRecord({
        x: 4 * BLOCK_SIZE,
        y: 12 * BLOCK_SIZE,
        side: 'human',
        level: 'basic',
      }))
      yield put({
        type: 'ACTIVATE_PLAYER',
        playerName: 'player-1',
        tankId,
      })
    } else {
      yield put({ type: 'ALL_HUMAN_DEAD' })
    }
  }
}

function* stageStatistics() {
  yield put({ type: 'SHOW_OVERLAY', overlay: 'statistics' })
  yield delay(5000)
  yield put({ type: 'REMOVE_OVERLAY', overlay: 'statistics' })
}

// 该saga用来管理游戏进度
// 例如当前处于第几关, 当前得分
export default function* gameManager() {
  yield fork(watchGameover)
  yield fork(humanPlayerSaga, 'player-1')

  yield put({ type: 'LOAD_STAGE', name: 'test' })

  yield take('CLEAR_STAGE')

  yield* stageStatistics()

  yield put({ type: 'LOAD_STAEG', name: 'test' })
}
