import { combineReducers } from 'redux'
import explosions from 'reducers/explosions'
import flickers from 'reducers/flickers'
import players from 'reducers/players'
import map from 'reducers/map'
import bullets from 'reducers/bullets'
import tanks from 'reducers/tanks'
import * as A from 'utils/actions'

function time(state = 0, action) {
  if (action.type === A.TICK) {
    return state + action.delta
  } else {
    return state
  }
}

export default combineReducers({
  players,
  bullets,
  map,
  time,
  explosions,
  flickers,
  tanks,
})
