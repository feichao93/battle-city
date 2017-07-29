import { delay } from 'redux-saga'
import { select, put, fork, take, call } from 'redux-saga/effects'
import * as selectors from 'utils/selectors'
import { UP, BLOCK_SIZE } from 'utils/constants'
import { getNextId, spawnTank } from 'utils/common'
import { TankRecord, State } from 'types'

function* animateTexts(textIds: TextId[], { direction, distance: totalDistance, duration }:
  { direction: Direction, distance: number, duration: number }) {
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
  console.debug('GAMEOVER')
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

function* playerSaga(playerName: string) {
  yield put({
    type: 'CREATE_PLAYER',
    playerName,
    lives: 3,
  })

  while (true) {
    yield take(['REMOVE_TANK', 'LOAD_STAGE'])
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank == null) {
      const { players }: State = yield select()
      const player = players.get(playerName)
      if (player.lives > 0) {
        yield put({ type: 'DECREMENT_PLAYER_LIVE', playerName })
        const tankId = yield* spawnTank({
          x: 4 * BLOCK_SIZE,
          y: 12 * BLOCK_SIZE,
          side: 'human',
        })
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
}

// 该saga用来管理游戏进度
// 例如当前处于第几关, 当前得分
export default function* gameManager() {
  yield fork(watchGameover)
  yield fork(playerSaga, 'player-1')

  yield put({
    type: 'CREATE_PLAYER',
    playerName: 'AI',
    lives: Infinity,
  })

  yield put({ type: 'LOAD_STAGE', name: 'test' })
}
