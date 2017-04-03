import { Map, Set } from 'immutable'
import TextRecord from 'types/TextRecord'
import * as A from 'utils/actions'
import { DIRECTION_MAP } from 'utils/constants'
import { inc, dec } from 'utils/common'

export default function textsReducer(state = Map(), action) {
  if (action.type === A.SET_TEXT) {
    return state.set(action.textId, TextRecord(action))
  } else if (action.type === A.UPDATE_TEXT_POSITION) {
    const { textIds, direction, distance } = action
    const set = Set(textIds)
    return state.map((t, textId) => {
      if (set.has(textId)) {
        const [xy, incdec] = DIRECTION_MAP[direction]
        return t.update(xy, (incdec === 'inc' ? inc : dec)(distance))
      } else {
        return t
      }
    })
  } else if (action.type === A.REMOVE_TEXT) {
    return state.delete(action.textId)
  } else {
    return state
  }
}
