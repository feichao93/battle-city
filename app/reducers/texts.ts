import { Map, Set } from 'immutable'
import { TextRecord } from '../types'
import { A, Action } from '../utils/actions'
import { getDirectionInfo } from '../utils/common'

export type TextsMap = Map<TextId, TextRecord>

export default function textsReducer(state = Map() as TextsMap, action: Action) {
  if (action.type === A.SetText) {
    return state.set(action.text.textId, action.text)
  } else if (action.type === A.MoveTexts) {
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
  } else if (action.type === A.RemoveText) {
    return state.delete(action.textId)
  } else {
    return state
  }
}
