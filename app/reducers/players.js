import { Map } from 'immutable'
import PlayerRecord from 'types/PlayerRecord'
import * as A from 'utils/actions'

export default function players(state = Map(), action) {
  if (action.type === A.ACTIVATE_PLAYER) {
    const { playerName, tankId } = action
    return state.mergeIn([playerName], {
      active: true,
      tankId,
    })
  } else if (action.type === A.CREATE_PLAYER) {
    return state.set(action.playerName, PlayerRecord(action))
  } else if (action.type === A.REMOVE_PLAYER) {
    return state.delete(action.playerName)
  } else {
    return state
  }
}
