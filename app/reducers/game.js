import { Map } from 'immutable'

const initialState = Map({
  remainingEnemyCount: 20,
})

export default function game(state = initialState, action) {
  return state
}
