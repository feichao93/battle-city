import { Map } from 'immutable'
import * as A from 'utils/actions'

const playerInitialState = Map({
  active: false,
  tankId: -1,
  lives: 3, // 玩家的生命
  score: 0,
})

export default function player(state = playerInitialState, action) {
  if (action.type === A.ACTIVATE_PLAYER) {
    return state.set('active', true).set('tankId', action.tankId)
  } else {
    return state
  }
}
