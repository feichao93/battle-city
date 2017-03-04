import { Map } from 'immutable'
import { combineReducers } from 'redux-immutable'
import { UP, DIRECTION_MAP, BLOCK_SIZE } from 'utils/constants'
import BulletRecord from 'types/BulletRecord'
import map from 'reducers/map'
import * as A from 'utils/actions'

const playerInitialState = Map({
  x: 4 * BLOCK_SIZE,
  y: 12 * BLOCK_SIZE,
  direction: UP,
  moving: false,
})

function player(state = playerInitialState, action) {
  if (action.type === A.TURN) {
    const { direction } = action
    const [xy] = DIRECTION_MAP[direction]
    return state.set('direction', direction)
      .update(xy === 'x' ? 'y' : 'x', t => Math.round(t / 4) * 4)
  } else if (action.type === A.MOVE) {
    return action.player
  } else if (action.type === A.START_MOVE) {
    return state.set('moving', true)
  } else if (action.type === A.STOP_MOVE) {
    return state.set('moving', false)
  } else {
    return state
  }
}

function bullets(state = Map(), action) {
  if (action.type === A.ADD_BULLET) {
    const { direction, speed, x, y, owner } = action
    return state.set(owner, BulletRecord({ owner, direction, speed, x, y }))
  } else if (action.type === A.DESTROY_BULLETS) {
    const set = action.bullets.toSet()
    return state.filterNot(bullet => set.has(bullet))
  } else if (action.type === A.UPDATE_BULLETS) {
    return state.merge(action.updatedBullets)
  } else {
    return state
  }
}

export default combineReducers({
  player,
  bullets,
  map,
})
