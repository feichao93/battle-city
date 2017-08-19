import * as _ from 'lodash'
import { Map, Repeat } from 'immutable'
import { delay } from 'redux-saga'
import { race, fork, put, select, take } from 'redux-saga/effects'
import { State } from 'reducers/index'
import * as selectors from 'utils/selectors'
import { getNextId } from 'utils/common'
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
    yield delay(300)
  }
  yield delay(1000)
  yield put<Action>({ type: 'SHOW_TOTAL_KILL_COUNT' })
  yield delay(3000)
}

function* powerUp(powerUp: PowerUpRecord) {
  const powerUpBlinkArray = Repeat(250, 150)
  const pickThisPowerUp = (action: Action) => (
    action.type === 'PICK_POWER_UP' && action.powerUpId === powerUp.powerUpId
  )
  try {
    yield put<Action>({
      type: 'ADD_POWER_UP',
      powerUp,
    })
    let visible = true
    for (const timeout of powerUpBlinkArray) {
      const result = yield race({
        timeout: delay(timeout),
        picked: take(pickThisPowerUp),
      })
      if (result.picked) {
        const action = result.picked as Action.PickPowerUpAction
        log(`tank ${action.tank.tankId} picked ${powerUp.powerUpName}`)
        break
      } // else timeout
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

/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡相关信息
 */
export default function* stageSaga(stageName: string) {
  yield put<Action>({ type: 'LOAD_SCENE', scene: 'game' })
  yield put<Action>({ type: 'LOAD_STAGE', name: stageName })

  while (true) {
    const { sourcePlayer, targetTank }: Action.KillAction = yield take('KILL')
    const { players, game: { remainingEnemies }, tanks }: State = yield select()

    if (sourcePlayer.side === 'human') { // human击杀ai
      // 对human player的击杀信息进行统计
      yield put<Action>({
        type: 'INC_KILL_COUNT',
        playerName: sourcePlayer.playerName,
        level: targetTank.level,
      })

      // 处理powerup
      if (/* todo targetTank.withPowerUp */ true) {
        const powerUpName = _.sample(['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel'] as PowerUpName[])
        const validPositions: Point[] = yield select(selectors.validPowerUpSpawnPositions)
        const position = _.sample(validPositions)
        yield fork(powerUp, PowerUpRecord({
          powerUpId: getNextId('power-up'),
          powerUpName,
          visible: true,
          x: position.x,
          y: position.y,
        }))
      }

      if (remainingEnemies.isEmpty()
        && tanks.filter(t => t.side === 'ai').isEmpty()) {
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
