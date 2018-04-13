import { Map } from 'immutable'
import PlayerRecord from '../types/PlayerRecord'
import { inc } from '../utils/common'

export type PlayersMap = Map<PlayerName, PlayerRecord>

export default function players(state = Map() as PlayersMap, action: Action) {
  if (action.type === 'ACTIVATE_PLAYER') {
    const { playerName, tankId } = action
    return state.update(playerName, player =>
      player.set('activeTankId', tankId).set('active', true),
    )
  } else if (action.type === 'ADD_PLAYER') {
    return state.set(action.player.playerName, action.player)
  } else if (action.type === 'REMOVE_PALYER') {
    return state.remove(action.playerName)
  } else if (action.type === 'START_STAGE') {
    return state.filterNot(player => player.side === 'ai')
  } else if (action.type === 'SET_REVERSED_TANK') {
    const { playerName, reversedTank } = action
    return state.update(playerName, p => p.set('reservedTank', reversedTank))
  } else if (action.type === 'REMOVE_TANK') {
    return state.map(p => (p.activeTankId === action.tankId ? p.set('activeTankId', 0) : p))
  } else if (action.type === 'DEACTIVATE_ALL_PLAYERS') {
    return state.map(p => p.set('active', false))
  } else if (action.type === 'DECREMENT_PLAYER_LIFE') {
    const player = state.get(action.playerName)
    return state.set(action.playerName, player.update('lives', x => x - 1))
  } else if (action.type === 'INCREMENT_PLAYER_LIFE') {
    return state.update(action.playerName, p => p.update('lives', inc(1)))
  } else {
    return state
  }
}
