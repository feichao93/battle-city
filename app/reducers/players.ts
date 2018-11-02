import PlayerRecord from '../types/PlayerRecord'
import { A, Action } from '../utils/actions'
import { dec, inc } from '../utils/common'

export function playerReducerFactory(playerName: PlayerName) {
  const initState = new PlayerRecord({ playerName, side: 'player' })
  return function players(state = initState, action: Action) {
    if (action.type === A.ActivatePlayer && action.playerName === playerName) {
      return state.set('activeTankId', action.tankId)
    } else if (action.type === A.SetPlayerTankSpawningStatus && action.playerName === playerName) {
      return state.set('isSpawningTank', action.isSpawning)
    } else if (action.type === A.StartGame) {
      return state.set('lives', 3)
    } else if (action.type === A.SetReservedTank && action.playerName === playerName) {
      return state.set('reservedTank', action.tank)
    } else if (action.type === A.SetTankToDead) {
      return state.activeTankId === action.tankId ? state.set('activeTankId', -1) : state
    } else if (action.type === A.DecrementPlayerLife && action.playerName === playerName) {
      return state.update('lives', dec(1))
    } else if (action.type === A.IncrementPlayerLife && action.playerName === playerName) {
      return state.update('lives', inc(action.count))
    } else if (action.type === A.IncPlayerScore && action.playerName === playerName) {
      return state.update('score', inc(action.count))
    } else {
      return state
    }
  }
}

export const player1 = playerReducerFactory('player-1')
export const player2 = playerReducerFactory('player-2')
