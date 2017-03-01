import { Map } from 'immutable'
import { combineReducers } from 'redux-immutable'
import { UP, DOWN, LEFT, RIGHT } from 'utils/constants'
import * as A from 'utils/actions'
import { inc, dec } from 'utils/common'

const playerInitialState = Map({
  x: 0,
  y: 0,
  direction: UP,
  moving: false,
})

function player(state = playerInitialState, action) {
  if (action.type === A.MOVE) {
    const { direction } = action
    if (direction !== state.get('direction')) {
      return state.set('direction', direction)
    } else if (direction === UP) {
      return state.update('y', dec)
    } else if (direction === DOWN) {
      return state.update('y', inc)
    } else if (direction === LEFT) {
      return state.update('x', dec)
    } else if (direction === RIGHT) {
      return state.update('x', inc)
    } else {
      throw new Error(`Invalid direction ${direction}`)
    }
  } else if (action.type === A.START_MOVE) {
    return state.set('moving', true)
  } else if (action.type === A.STOP_MOVE) {
    return state.set('moving', false)
  } else {
    return state
  }
}

export default combineReducers({
  player,
})
