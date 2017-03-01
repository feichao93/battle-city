import { Map } from 'immutable'
import { combineReducers } from 'redux-immutable'
import { LEFT, FIELD_BSIZE, BLOCK_SIZE, DIRECTION_MAP } from 'utils/constants'
import BulletRecord from 'types/BulletRecord'
import * as A from 'utils/actions'
import * as R from 'ramda'

const playerInitialState = Map({
  x: 0,
  y: 0,
  direction: LEFT,
  moving: false,
})

const clamp = R.clamp(0, BLOCK_SIZE * (FIELD_BSIZE - 1))

function player(state = playerInitialState, action) {
  if (action.type === A.MOVE) {
    const { direction, distance } = action
    if (direction !== state.get('direction')) {
      return state.set('direction', direction)
    } else {
      const [xy, incdec] = DIRECTION_MAP[direction]
      return state.update(xy,
        incdec === 'inc'
          ? R.pipe(R.add(distance), clamp)
          : R.pipe(R.subtract(R.__, distance), clamp))
    }
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
  } else if (action.type === A.SET_BULLETS) {
    return Map(action.bullets)
  } else {
    return state
  }
}

export default combineReducers({
  player,
  bullets,
})
