// { type: MOVE, direction: UP|DOWN|LEFT|RIGHT, distance }
export const MOVE = 'MOVE'

// { type: START_MOVE }
export const START_MOVE = 'START_MOVE'

// { type: STOP_MOVE }
export const STOP_MOVE = 'STOP_MOVE'

// { type: TICK, delta: <seconds-elapsed-since-last-tick> }
export const TICK = 'TICK'

// { type: ADD_BULLET, direction, speed, x, y, owner }
export const ADD_BULLET = 'ADD_BULLET'

// { type: DESTROY_BULLET, owner }
export const DESTROY_BULLET = 'DESTROY_BULLET'

// { type: SET_BULLETS, bullets }
export const SET_BULLETS = 'SET_BULLETS'
