import { Record } from 'immutable'
import { FlickerId } from 'types'

type Base = {
  flickerId: FlickerId,
  x: number,
  y: number,
}

type FlickerRecord = Record.Instance<Base> & Readonly<Base>

const FlickerRecord = Record({
  flickerId: 0,
  x: 0,
  y: 0,
} as Base)

export default FlickerRecord
