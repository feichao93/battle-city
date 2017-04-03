import { Map } from 'immutable'
import * as A from 'utils/actions'

const initialState = Map({
  overlay: null, // gameover | null
  // status: 'idle', // idle | on | gameover | win
  remainingEnemyCount: 20,
  // currentStageIndex: 0,
})

export default function game(state = initialState, action) {
  if (action.type === A.SHOW_OVERLAY) {
    return state.set('overlay', action.overlay)
  } else if (action.type === A.REMOVE_OVERLAY) {
    return state.set('overlay', null)
  } else {
    return state
  }
}
