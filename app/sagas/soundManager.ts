import { takeEvery } from 'redux-saga/effects'
import * as actions from '../utils/actions'
import { A } from '../utils/actions'

const SOUND_NAMES: SoundName[] = [
  'stage_start',
  'game_over',
  'bullet_shot',
  'bullet_hit_1',
  'bullet_hit_2',
  'explosion_1',
  'explosion_2',
  'pause',
  'powerup_appear',
  'powerup_pick',
  'statistics_1',
]

export default function* soundManager() {
  const map = new Map(
    SOUND_NAMES.map(name => {
      const audio = new Audio(`sound/${name}.ogg`)
      audio.load()
      return [name, audio] as [SoundName, HTMLAudioElement]
    }),
  )

  yield takeEvery(A.PlaySound, function*({ soundName }: actions.PlaySound) {
    try {
      yield map.get(soundName).play()
    } catch (e) {}
  })
}
