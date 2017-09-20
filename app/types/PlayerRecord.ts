import { Record } from 'immutable'
import TankRecord from 'types/TankRecord'

const PlayerRecord = Record({
  playerName: null as PlayerName,
  side: 'human' as Side,
  activeTankId: -1,
  lives: 0,
  score: 0,
  active: false,
  reservedTank: null as TankRecord,
})

const record = PlayerRecord()

type PlayerRecord = typeof record

export default PlayerRecord
