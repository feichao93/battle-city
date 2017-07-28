import { Map } from 'immutable'
import PlayerRecord from 'types/PlayerRecord'

export type PlayersMap = Map<PlayerName, PlayerRecord>

export default function players(state = Map() as PlayersMap, action: Action) {
  if (action.type === 'ACTIVATE_PLAYER') {
    const { playerName, tankId } = action
    return state.mergeIn([playerName], {
      active: true,
      tankId,
    })
  } else if (action.type === 'CREATE_PLAYER') {
    return state.set(action.playerName, PlayerRecord(action))
  } else if (action.type === 'REMOVE_PLAYER') {
    return state.delete(action.playerName)
  } else if (action.type === 'DEACTIVATE_ALL_PLAYERS') {
    return state.map(p => p.set('active', false))
  } else if (action.type === 'DECREMENT_PLAYER_LIVE') {
    const player = state.get(action.playerName)
    return state.set(action.playerName, player.update('lives', x => x - 1))
  } else {
    return state
  }
}
