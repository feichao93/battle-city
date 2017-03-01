import { Map, List } from 'immutable'
import { combineReducers } from 'redux-immutable'
import { UP, DOWN, LEFT, RIGHT, FIELD_BSIZE, BLOCK_SIZE } from 'utils/constants'
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
    const decAndClamp = R.pipe(R.subtract(R.__, distance), clamp)
    const incAndClamp = R.pipe(R.add(distance), clamp)
    if (direction !== state.get('direction')) {
      return state.set('direction', direction)
    } else if (direction === UP) {
      return state.update('y', decAndClamp)
    } else if (direction === DOWN) {
      return state.update('y', incAndClamp)
    } else if (direction === LEFT) {
      return state.update('x', decAndClamp)
    } else if (direction === RIGHT) {
      return state.update('x', incAndClamp)
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

// todo List需要改成Map
function bullets(state = List(), action) {
  if (action.type === A.ADD_BULLET) {
    const { direction, speed, x, y, owner } = action
    return state.push(BulletRecord({ owner, direction, speed, x, y }))
  } else if (action.type === A.DESTROY_BULLET) {
    return state.filterNot(b => b.owner === action.owner)
  } else if (action.type === A.SET_BULLETS) {
    return action.bullets
  } else {
    return state
  }
}

export default combineReducers({
  player,
  bullets,
})
