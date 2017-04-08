import { Map, Record } from 'immutable'
import { Action } from 'utils/actions'

type Base = {
  overlay: string,
  remainingEnemyCount: number,
}

export const GameRecord = Record({
  overlay: '', // gameover | <empty-string>
  // status: 'idle', // idle | on | gameover | win
  remainingEnemyCount: 20,
  // currentStageIndex: 0,
}, 'GameRecord')

export type GameRecord = Record.Instance<{
  overlay: string,
  remainingEnemyCount: number,
}> & Readonly<Base>

export default function game(state = GameRecord(), action: Action) {
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
