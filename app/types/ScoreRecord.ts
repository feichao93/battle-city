import { Record } from 'immutable'

const ScoreRecordBase = Record({
  scoreId: 0,
  score: 100,
  x: 0,
  y: 0,
})

export default class ScoreRecord extends ScoreRecordBase {
  static fromJS(object: any) {
    return new ScoreRecord(object)
  }
}
