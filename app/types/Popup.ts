import { Record } from 'immutable'

export type PopupType = 'alert' | 'confirm'

export default class Popup extends Record({
  type: 'alert' as PopupType,
  message: '',
}) {}
