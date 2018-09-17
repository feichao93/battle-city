import { Map } from 'immutable'
import { ScoreRecord } from '../types'
import { A, Action } from '../utils/actions'

export type ScoresMap = Map<ScoreId, ScoreRecord>

export default function scores(state = Map() as ScoresMap, action: Action) {
  if (action.type === A.AddScore) {
    return state.set(action.score.scoreId, new ScoreRecord(action.score))
  } else if (action.type === A.RemoveScore) {
    return state.delete(action.scoreId)
  } else {
    return state
  }
}
