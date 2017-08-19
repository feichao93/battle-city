import { Record } from 'immutable'

const PowerUpRecord = Record({
  powerUpId: 0 as PowerUpId,
  x: 0,
  y: 0,
  visible: true,
  powerUpName: 'tank' as PowerUpName,
})

const record = PowerUpRecord()

type PowerUpRecord = typeof record

export default PowerUpRecord
