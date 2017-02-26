import { Map } from 'immutable'

const initialState = Map()

export default function reducer(state = initialState, action) {
  if (action.type === 'foo') {
    return state
  } else {
    return state
  }
}
