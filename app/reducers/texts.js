import { Map, Set } from 'immutable'
import TextRecord from 'types/TextRecord'
import * as A from 'utils/actions'
import { getDirectionInfo } from 'utils/common'

export default function textsReducer(state = Map(), action) {
  if (action.type === A.SET_TEXT) {
    return state.set(action.textId, TextRecord(action))
  } else if (action.type === A.UPDATE_TEXT_POSITION) {
    const { textIds, direction, distance } = action
    const set = Set(textIds)
    return state.map((t, textId) => {
      if (set.has(textId)) {
        const { xy, updater } = getDirectionInfo(direction)
        return t.update(xy, updater(distance))
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
