import { Record } from 'immutable'
import TankRecord from './TankRecord'

const PlayerRecordBase = Record({
  playerName: null as PlayerName,
  side: 'player' as Side,
  activeTankId: -1,
  lives: 0,
  score: 0,
  reservedTank: null as TankRecord,
  isSpawningTank: false,
})

export default class PlayerRecord extends PlayerRecordBase {
  static fromJS(object: any) {
    return new PlayerRecord(object).update('reservedTank', TankRecord.fromJS)
  }

  isActive() {
    return this.activeTankId !== -1
  }
}
