const names = [
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

const sounds = new Map(
  names.map(name => [name, new Audio(`/sound/${name}.ogg`)] as [string, HTMLAudioElement]),
)

const noop = () => 0
// force pre-load all the sounds
sounds.forEach(sound => {
  sound.play().catch(noop)
  setTimeout(() => sound.pause(), 10)
})

function play(name: string) {
  sounds.get(name).play()
}

// TODO 改成 play-sound-effect，或者使用对应的 generator
const soundManager = {
  stage_start: () => play('stage_start'),
  game_over: () => play('game_over'),
  bullet_shot: () => play('bullet_shot'),
  bullet_hit_1: () => play('bullet_hit_1'),
  bullet_hit_2: () => play('bullet_hit_2'),
  explosion_1: () => play('explosion_1'),
  explosion_2: () => play('explosion_2'),
  pause: () => play('pause'),
  powerup_appear: () => play('powerup_appear'),
  powerup_pick: () => play('powerup_pick'),
  statistics_1: () => play('statistics_1'),
}

export default soundManager
