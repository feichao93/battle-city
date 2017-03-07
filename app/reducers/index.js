import { combineReducers } from 'redux-immutable'
import explosions from 'reducers/explosions'
import flickers from 'reducers/flickers'
import player from 'reducers/player'
import map from 'reducers/map'
import bullets from 'reducers/bullets'
import * as A from 'utils/actions'

function time(state = 0, action) {
  if (action.type === A.TICK) {
    return state + action.delta
  } else {
    return state
  }
}

export default combineReducers({
  player,
  bullets,
  map,
  time,
  explosions,
  flickers,
})
