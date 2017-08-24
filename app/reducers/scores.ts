import { Map } from 'immutable'
import { ScoreRecord } from 'types'

export type ScoresMap = Map<ScoreId, ScoreRecord>

export default function scores(state = Map() as ScoresMap, action: Action) {
  if (action.type === 'ADD_SCORE') {
    return state.set(action.score.scoreId, ScoreRecord(action.score))
  } else if (action.type === 'REMOVE_SCORE') {
    return state.delete(action.scoreId)
  } else {
    return state
  }
}
