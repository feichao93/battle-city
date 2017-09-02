import * as _ from 'lodash'
import { List, Map, Repeat, Collection } from 'immutable'
import { delay, Effect } from 'redux-saga'
import { race, fork, put, select, take } from 'redux-saga/effects'
import { State } from 'reducers/index'
import * as selectors from 'utils/selectors'
import { getNextId, frame as f } from 'utils/common'
import { PowerUpRecord } from 'types'

const log = console.log

const tankLevels: TankLevel[] = ['basic', 'fast', 'power', 'armor']

function* statistics() {
  yield put<Action>({ type: 'LOAD_SCENE', scene: 'statistics' })

  const { game: { killInfo } }: State = yield select()

  const player1KillInfo = killInfo.get('player-1', Map<TankLevel, KillCount>())

  // todo 目前只考虑player-1的信息

  yield delay(500)

  for (const tankLevel of tankLevels) {
    const { game: { transientKillInfo } }: State = yield select()

    yield delay(250)
    const levelKillCount = player1KillInfo.get(tankLevel, 0)
    if (levelKillCount === 0) {
      yield put<Action>({
        type: 'UPDATE_TRANSIENT_KILL_INFO',
        info: transientKillInfo.setIn(['player-1', tankLevel], 0),
      })
    } else {
      for (let count = 1; count <= levelKillCount; count += 1) {
        yield put<Action>({
          type: 'UPDATE_TRANSIENT_KILL_INFO',
          info: transientKillInfo.setIn(['player-1', tankLevel], count),
        })
        yield delay(160)
      }
    }
    yield delay(200)
  }
  yield delay(200)
  yield put<Action>({ type: 'SHOW_TOTAL_KILL_COUNT' })
  yield delay(1000)
}

function* powerUp(powerUp: PowerUpRecord) {
  const pickThisPowerUp = (action: Action) => (
    action.type === 'PICK_POWER_UP' && action.powerUp.powerUpId === powerUp.powerUpId
  )
  try {
    yield put<Action>({
      type: 'ADD_POWER_UP',
      powerUp,
    })
    let visible = true
    for (let i = 0; i < 50; i++) {
      const result = yield race({
        timeout: delay(f(8)),
        picked: take(pickThisPowerUp),
        stageChanged: take('START_STAGE'),
      })
      if (result.picked || result.stageChanged) {
        break
      } // else timeout. continue
      visible = !visible
      yield put<Action>({
        type: 'UPDATE_POWER_UP',
        powerUp: powerUp.set('visible', visible),
      })
    }
  } finally {
    yield put<Action>({
      type: 'REMOVE_POWER_UP',
      powerUpId: powerUp.powerUpId,
    })
  }
}

function* tween(duration: number, effectFactory: (t: number) => Effect) {
  let accumulation = 0
  while (accumulation < duration) {
    const { delta }: Action.TickAction = yield take('TICK')
    accumulation += delta
    yield effectFactory(_.clamp(accumulation / duration, 0, 1))
  }
}

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡相关信息
 */
export default function* stageSaga(stageName: string) {
  yield put<Action>({ type: 'LOAD_SCENE', scene: 'game' })

  // todo action SHOW_CURTAIN
  yield put<Action>({
    type: 'UPDATE_CURTAIN',
    curtainName: 'stage-enter-cutain',
    t: 0,
  })

  yield* tween(f(50), t => put<Action>({
    type: 'UPDATE_CURTAIN',
    curtainName: 'stage-enter-cutain',
    t,
  }))
  yield delay(f(20))
  yield put<Action>({
    type: 'LOAD_STAGE_MAP',
    name: stageName,
  })
  yield delay(f(30))
  yield* tween(f(50), t => put<Action>({
    type: 'UPDATE_CURTAIN',
    curtainName: 'stage-enter-cutain',
    t: 1 - t,
  }))
  // todo action HIDE_CURTAIN
  // yield svgFilter 添加反色效果
  // yield put<Action>({type:'FILTER_INVERT'})
  // 移除反色效果
  // yield fork(delayedPut, f(3), { type: 'REMOEV_FILTER_INVERT' })
  yield put<Action>({ type: 'START_STAGE', name: stageName })
  yield put<Action>({ type: 'SHOW_HUD' })

  while (true) {
    const { sourcePlayer, targetTank }: Action.KillAction = yield take('KILL')
    const { players, game: { remainingEnemies }, tanks }: State = yield select()

    // TODO 这里sourcePlayer可能为空将导致游戏崩溃 (AI-PLAYER被移除了)
    if (sourcePlayer.side === 'human') { // human击杀ai
      // 对human player的击杀信息进行统计
      yield put<Action>({
        type: 'INC_KILL_COUNT',
        playerName: sourcePlayer.playerName,
        level: targetTank.level,
      })

      // 处理powerup
      if (targetTank.withPowerUp) {
        const powerUpName = _.sample(['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel'] as PowerUpName[])
        const position: Point = _.sample(yield select(selectors.validPowerUpSpawnPositions))
        yield fork(powerUp, PowerUpRecord({
          powerUpId: getNextId('power-up'),
          powerUpName,
          visible: true,
          x: position.x,
          y: position.y,
        }))
      }

      const activeAITanks = tanks.filter(t => (t.active && t.side === 'ai'))
      if (remainingEnemies.isEmpty() && activeAITanks.isEmpty()) {
        // 剩余enemy数量为0, 且场上已经没有ai tank了
        // todo 如果场上有powerup, 则delay时间可以适当延长; 如果场上没有power, 则delay时间可以缩短
        yield delay(6000)
        yield* statistics()
        return { status: 'clear' }
      }
    } else { // ai击杀human
      if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
        // 所有的human player都挂了
        yield delay(2000)
        yield* statistics()
        return { status: 'fail', reason: 'all-human-dead' }
      }
    }
  }
}
