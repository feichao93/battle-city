import { Map, List } from 'immutable'
import { combineReducers } from 'redux-immutable'
import { LEFT, FIELD_BSIZE, BLOCK_SIZE, ITEM_SIZE_MAP } from 'utils/constants'
import BulletRecord from 'types/BulletRecord'
import * as A from 'utils/actions'

const bricks = []
const steels = []
for (let i = 0; i < (BLOCK_SIZE / ITEM_SIZE_MAP.BRICK * FIELD_BSIZE) ** 2; i += 1) {
  bricks.push(Math.random() < 0.03)
  steels.push(Math.random() < 0.01)
}

const mapInitialState = Map({
  bricks: List(bricks),
  steels: List(steels),
  // river: Repeat(false, (config.river * FIELD_BSIZE) ** 2),
  // snow: Repeat(false, (config.snow * FIELD_BSIZE) ** 2),
  // forest: Repeat(false, (config.forest * FIELD_BSIZE) ** 2),
})

function map(state = mapInitialState, action) {
  if (action.type === A.LOAD_MAP) {
    return state
  } else {
    return state
  }
}

const playerInitialState = Map({
  x: 0,
  y: 0,
  direction: LEFT,
  moving: false,
})

function player(state = playerInitialState, action) {
  if (action.type === A.TURN) {
    return state.set('direction', action.direction)
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
