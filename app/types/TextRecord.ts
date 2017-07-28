import { Record } from 'immutable'

type Base = {
  textId: TextId,
  content: string,
  fill: string,
  x: number,
  y: number,
}

type TextRecord = Record.Instance<Base> & Readonly<Base>

const TextRecord = Record({
  textId: 0,
  content: '',
  fill: '#000000',
  x: 0,
  y: 0,
} as Base)

export default TextRecord
