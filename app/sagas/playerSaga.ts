import { eventChannel } from 'redux-saga'
import { fork, put, race, select, take, takeEvery } from 'redux-saga/effects'
import { spawnTank } from '../sagas/common'
import { PlayerConfig, PlayerRecord, State, TankRecord } from '../types'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'
import { frame, getNextId } from '../utils/common'
import { LIFE_BONUS_SCORE } from '../utils/constants'
import * as selectors from '../utils/selectors'
import playerController from './playerController'
import playerTankSaga from './playerTankSaga'

export default function* playerSaga(playerName: PlayerName, config: PlayerConfig) {
  yield takeEvery(A.StartStage, spawnPlayerTank)
  yield takeEvery(A.BeforeEndStage, reserveTankOnStageEnd)
  yield takeEvery(playerScoreIncremented, handleIncPlayerScore)
  yield fork(borrowLifeWatcher)

  while (true) {
    const { tankId }: actions.ActivatePlayer = yield take(playerActivated)
    const result = yield race({
      controller: playerController(tankId, config),
      tank: playerTankSaga(playerName, tankId),
      stageEnd: take(A.EndStage),
    })
    if (result.tank) {
      yield fork(spawnPlayerTank)
    }
  }

  // region function deftinitions
  function* borrowLifeWatcher() {
    const chan = eventChannel(emit => {
      const callback = (event: KeyboardEvent) => {
        if (event.code === config.control.fire) {
          emit('borrow')
        }
      }
      document.addEventListener('keydown', callback)
      return () => document.removeEventListener('keydown', callback)
    })
    try {
      while (true) {
        yield take(chan)
        const state: State = yield select()
        const inMultiPlayersMode = selectors.isInMultiPlayersMode(state)
        const player: PlayerRecord = selectors.player(state, playerName)
        if (inMultiPlayersMode && !player.isActive() && player.lives === 0) {
          const lenderName = playerName === 'player-1' ? 'player-2' : 'player-1'
          const lender = selectors.player(state, lenderName)
          if (lender.lives > 0) {
            yield put(actions.decrementPlayerLife(lenderName))
            yield put(actions.incrementPlayerLife(playerName))
            yield spawnPlayerTank()
          }
        }
      }
    } finally {
      chan.close()
    }
  }

  function playerActivated(action: actions.Action) {
    return action.type === A.ActivatePlayer && action.playerName === playerName
  }

  function* spawnPlayerTank() {
    const player: PlayerRecord = yield select(selectors.player, playerName)

    let tankPrototype: TankRecord = null

    if (player.reservedTank) {
      tankPrototype = player.reservedTank
      yield put(actions.setReservedTank(playerName, null))
    } else if (player.lives > 0) {
      tankPrototype = new TankRecord({ side: 'player', color: config.color })
      yield put(actions.decrementPlayerLife(playerName))
    }

    try {
      if (tankPrototype) {
        const tankId = getNextId('tank')
        yield put(actions.setPlayerTankSpawningStatus(playerName, true))
        yield spawnTank(
          tankPrototype.merge({
            tankId,
            alive: true,
            x: config.spawnPos.x,
            y: config.spawnPos.y,
            direction: 'up',
            helmetDuration: frame(135),
          }),
        )
        yield put(actions.activatePlayer(playerName, tankId))
      }
    } finally {
      yield put(actions.setPlayerTankSpawningStatus(playerName, false))
    }
  }

  function* reserveTankOnStageEnd() {
    const state: State = yield select()
    const player = selectors.player(state, playerName)
    const tank = state.tanks.get(player.activeTankId)
    if (tank) {
      yield put(actions.setReservedTank(playerName, tank))
      yield put(actions.setTankToDead(tank.tankId))
    }
  }

  function playerScoreIncremented(action: actions.Action) {
    return action.type === A.IncPlayerScore && action.playerName === playerName
  }

  function* handleIncPlayerScore(action: actions.IncPlayerScore) {
    DEV.ASSERT && console.assert(action.playerName === playerName)
    const { game }: State = yield select()
    const cntScore = game.playersScores.get(playerName)
    const prevScore = cntScore - action.count
    const cntLifeBonus = Math.floor(cntScore / LIFE_BONUS_SCORE)
    const prevLifeBonus = Math.max(0, Math.floor(prevScore / LIFE_BONUS_SCORE))
    if (cntLifeBonus - prevLifeBonus > 0) {
      yield put(actions.incrementPlayerLife(playerName, cntLifeBonus - prevLifeBonus))
    }
  }
  // endregion
}
