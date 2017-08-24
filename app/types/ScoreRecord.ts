import { Record } from 'immutable'

const ScoreRecord = Record({
  scoreId: 0,
  score: 100,
  x: 0,
  y: 0,
})

const record = ScoreRecord()

type ScoreRecord = typeof record

export default ScoreRecord
