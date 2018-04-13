import { Record } from 'immutable'
import TankRecord from './TankRecord'

const PlayerRecordBase = Record({
  playerName: null as PlayerName,
  side: 'human' as Side,
  activeTankId: -1,
  lives: 0,
  score: 0,
  active: false,
  reservedTank: null as TankRecord,
})

export default class PlayerRecord extends PlayerRecordBase {
  static fromJS(object: any) {
    return new PlayerRecord(object).update('reservedTank', TankRecord.fromJS)
  }
}
