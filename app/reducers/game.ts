import { Record } from 'immutable'

export const GameRecord = Record({
  overlay: '' as Overlay,
  // status: 'idle', // idle | on | gameover | win
  remainingEnemyCount: 20,
  // currentStageIndex: 0,
}, 'GameRecord')

const record = GameRecord()

export type GameRecord = typeof record

export default function game(state = record, action: Action) {
  if (action.type === 'SHOW_OVERLAY') {
    return state.set('overlay', action.overlay)
  } else if (action.type === 'REMOVE_OVERLAY') {
    return state.set('overlay', null)
  } else if (action.type === 'DECREMENT_ENEMY_COUNT') {
    return state.update('remainingEnemyCount', x => x - 1)
  } else {
    return state
  }
}
