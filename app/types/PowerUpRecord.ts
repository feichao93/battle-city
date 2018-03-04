import { Record } from 'immutable'

const PowerUpRecordBase = Record({
  powerUpId: 0 as PowerUpId,
  x: 0,
  y: 0,
  visible: true,
  powerUpName: 'tank' as PowerUpName,
})

export default class PowerUpRecord extends PowerUpRecordBase {
  static fromJS(object: any) {
    return new PowerUpRecord(object)
  }
}
