export const MOVE = 'MOVE'

export const START_MOVE = 'START_MOVE'

export const STOP_MOVE = 'STOP_MOVE'

// { type: TICK, delta: <seconds-elapsed-since-last-tick> }
export const TICK = 'TICK'

// { type: AFTER_TICK, delta: <seconds-elapsed-since-last-tick> }
export const AFTER_TICK = 'AFTER_TICK'

// { type: ADD_BULLET, direction, speed, x, y, power?, tankId }
export const ADD_BULLET = 'ADD_BULLET'

// { type: DESTROY_BULLETS, bullets, spawnExplosion: boolean }
export const DESTROY_BULLETS = 'DESTROY_BULLETS'

export const DESTROY_STEELS = 'DESTROY_STEELS'

// { type: DESTROY_BRICKS, ts: <set-of-t> }
export const DESTROY_BRICKS = 'DESTROY_BRICKS'

// { type: UPDATE_BULLETS, updatedBullets: <updated-bullets-map> }
export const UPDATE_BULLETS = 'UPDATE_BULLETS'

// { type: LOAD_STAGE, stage: <stage-configuration> }
export const LOAD_STAGE = 'LOAD_STAGE'

// 标记游戏结束
export const GAMEOVER = 'GAMEOVER'

export const SPAWN_EXPLOSION = 'SPAWN_EXPLOSION'
export const REMOVE_EXPLOSION = 'REMOVE_EXPLOSION'

export const SPAWN_FLICKER = 'SPAWN_FLICKER'
export const REMOVE_FLICKER = 'REMOVE_FLICKER'

export const DESTROY_EAGLE = 'DESTROY_EAGLE'

export const SPAWN_TANK = 'SPAWN_TANK'
export const REMOVE_TANK = 'REMOVE_TANK'

export const ACTIVATE_PLAYER = 'ACTIVATE_PLAYER'
export const DEACTIVATE_ALL_PLAYERS = 'DEACTIVATE_ALL_PLAYERS'
export const CREATE_PLAYER = 'CREATE_PLAYER'
export const REMOVE_PLAYER = 'REMOVE_PLAYER'

// 以下为 AI操作坦克的相关action
// 不断向前
export const AI_FORWORD = 'AI_FORWORD'
// 停止移动
export const AI_STOP_MOVE = 'AI_STOP_MOVE'
// 转向
export const AI_TURN = 'AI_TURN'
// 发射子弹
export const AI_FIRE = 'AI_FIRE'

export const SET_TEXT = 'SET_TEXT'
export const REMOVE_TEXT = 'REMOVE_TEXT'
export const UPDATE_TEXT_POSITION = 'UPDATE_TEXT_POSITION'
export const SHOW_OVERLAY = 'SHOW_OVERLAY'
export const REMOVE_OVERLAY = 'REMOVE_OVERLAY'
