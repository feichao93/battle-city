import { Map, Set } from 'immutable'
import { getDirectionInfo } from 'utils/common'
import { TextRecord } from 'types'

export type TextsMap = Map<TextId, TextRecord>

export default function textsReducer(state = Map() as TextsMap, action: Action) {
  if (action.type === 'SET_TEXT') {
    return state.set(action.textId, TextRecord(action))
  } else if (action.type === 'UPDATE_TEXT_POSITION') {
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
  } else if (action.type === 'REMOVE_TEXT') {
    return state.delete(action.textId)
  } else {
    return state
  }
}
