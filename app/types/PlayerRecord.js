import { Record } from 'immutable'

const PlayerRecord = Record({
  playerName: null,
  tankId: 0,
  lives: 0,
  score: 0,
  active: false,
})

export default PlayerRecord
