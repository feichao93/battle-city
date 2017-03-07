import { Map } from 'immutable'
import { UP, BLOCK_SIZE } from 'utils/constants'
import * as A from 'utils/actions'

const playerInitialState = Map({
  active: false,
  x: 4 * BLOCK_SIZE,
  y: 12 * BLOCK_SIZE,
  direction: UP,
  moving: false,
})

export default function player(state = playerInitialState, action) {
  if (action.type === A.MOVE) {
    return action.player
  } else if (action.type === A.SPAWN_PLAYER) {
    const { x, y, direction } = action
    return state.merge({
      x,
      y,
      direction,
      active: true,
    })
  } else if (action.type === A.START_MOVE) {
    return state.set('moving', true)
  } else if (action.type === A.STOP_MOVE) {
    return state.set('moving', false)
  } else {
    return state
  }
}
