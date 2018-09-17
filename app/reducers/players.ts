import { Map } from 'immutable'
import PlayerRecord from '../types/PlayerRecord'
import { inc } from '../utils/common'
import { A, Action } from '../utils/actions'

export type PlayersMap = Map<PlayerName, PlayerRecord>

export default function players(state = Map() as PlayersMap, action: Action) {
  if (action.type === A.ActivatePlayer) {
    const { playerName, tankId } = action
    return state.update(playerName, player =>
      player.set('activeTankId', tankId).set('active', true),
    )
  } else if (action.type === A.AddPlayer) {
    return state.set(action.player.playerName, action.player)
  } else if (action.type === A.RemovePlayer) {
    return state.remove(action.playerName)
  } else if (action.type === A.StartStage) {
    return state.filterNot(player => player.side === 'ai')
  } else if (action.type === A.SetReservedTank) {
    return state.update(action.playerName, p => p.set('reservedTank', action.tank))
  } else if (action.type === A.DeactivateTank) {
    return state.map(p => (p.activeTankId === action.tankId ? p.set('activeTankId', 0) : p))
  } else if (action.type === A.DeactivateAllPlayers) {
    return state.map(p => p.set('active', false))
  } else if (action.type === A.DecrementPlayerLife) {
    const player = state.get(action.playerName)
    return state.set(action.playerName, player.update('lives', x => x - 1))
  } else if (action.type === A.IncrementPlayerLife) {
    return state.update(action.playerName, p => p.update('lives', inc(1)))
  } else {
    return state
  }
}
