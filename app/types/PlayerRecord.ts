import { Record } from 'immutable'
import { TankId } from 'types'

type Base = {
  playerName: string,
  tankId: TankId,
  lives: number,
  score: number,
  active: boolean
}

type PlayerRecord = Record.Instance<Base> & Readonly<Base>

const PlayerRecord = Record({
  playerName: null,
  tankId: 0,
  lives: 0,
  score: 0,
  active: false,
})

export default PlayerRecord
