import { BLOCK_SIZE as B } from './constants'
import type Bullet from './entities/Bullet'
import Explosion, { BIG_EXPLOSION_DURATION } from './entities/Explosion'
import Flicker from './entities/Flicker'
import Tank from './entities/Tank'
import TerrainMap from './map/TerrainMap'
import { updateAnimations } from './systems/animation'
import { updateBullets, type BulletTankHit } from './systems/bullet'
import { fireTank } from './systems/fire'
import type { AudioPort, RawStageConfig } from './types'

/** 演示地图 */
const DEMO_STAGE: RawStageConfig = {
  name: 'demo',
  difficulty: 1,
  map: [
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  R  F  S  Bf Bf Ta X  X  X  X  X  X  ',
    'X  R  F  S  Bf Bf Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  Ta X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
    'X  X  X  X  X  X  X  X  X  X  X  X  E  ',
  ],
  bots: [],
}

/** 演示世界慢放倍数（原版 tickEmitter slow: 5） */
const SLOW = 5
/** 玩家开火间隔与 bot 重生等待按真实时间计（原版用的是 redux-saga 的 delay） */
const FIRE_INTERVAL = 3000
const BOT_RESPAWN_DELAY = 7000

const silentAudio: AudioPort = { play: () => {} }

/**
 * 画廊 fire 页的演示世界：两辆玩家坦克每 3 秒开火，打掉右侧的 bot 或穿过各类地形；
 * bot 被击毁 7 秒后重新出生。复用对局的子弹 / 开火 / 爆炸 / 闪烁系统。
 */
export default class FireDemo {
  readonly map = TerrainMap.fromRaw(DEMO_STAGE)
  readonly tanks: Tank[] = []
  readonly bullets: Bullet[] = []
  readonly explosions: Explosion[] = []
  readonly flickers: Flicker[] = []
  /** 演示世界的逻辑时间（已慢放） */
  time = 0
  paused = false
  /** 玩家坦克各自的开火节奏：出生即开火，之后每 3 秒一次 */
  private readonly shooters: Array<{ tank: Tank; timer: number; pending: boolean }> = []
  /** bot 阵亡后到重新出生的剩余等待；null 表示 bot 在场或正在出生 */
  private botRespawnTimer: number | null = null

  constructor() {
    const base = { side: 'player', direction: 'right', x: 0 } as const
    this.flickers.push(new Flicker(new Tank({ ...base, y: 0.5 * B, color: 'yellow' }), 2))
    this.flickers.push(
      new Flicker(new Tank({ ...base, y: 3.5 * B, color: 'green', level: 'fast' }), 2),
    )
    this.spawnBot()
  }

  step(realDelta: number): void {
    if (this.paused) {
      return
    }
    const delta = realDelta / SLOW

    for (const shooter of this.shooters) {
      shooter.timer += realDelta
      if (shooter.timer >= FIRE_INTERVAL) {
        shooter.timer -= FIRE_INTERVAL
        shooter.pending = true
      }
      const cooldownBefore = shooter.tank.cooldown
      fireTank(shooter.tank, shooter.pending, delta, this.bullets, silentAudio)
      if (shooter.tank.cooldown > cooldownBefore) {
        shooter.pending = false
      }
    }

    const hits: BulletTankHit[] = []
    updateBullets(this.bullets, this.map, this.explosions, silentAudio, delta, this.tanks, hits)
    for (const { target } of hits) {
      if (target.side === 'bot' && target.alive) {
        target.alive = false
        this.explosions.push(new Explosion({ x: target.x + 8, y: target.y + 8 }, 'big'))
        // 原版等爆炸动画（同样慢放）播完才开始计 7 秒
        this.botRespawnTimer = BIG_EXPLOSION_DURATION * SLOW + BOT_RESPAWN_DELAY
      }
    }
    updateAnimations(this.explosions, delta)
    this.tanks.splice(0, this.tanks.length, ...this.tanks.filter((t) => t.alive))

    for (const flicker of this.flickers) {
      flicker.advance(delta)
      if (flicker.done) {
        flicker.tank.bornAt = this.time
        this.tanks.push(flicker.tank)
        if (flicker.tank.side === 'player') {
          this.shooters.push({ tank: flicker.tank, timer: 0, pending: true })
        }
      }
    }
    this.flickers.splice(0, this.flickers.length, ...this.flickers.filter((f) => !f.done))

    if (this.botRespawnTimer != null) {
      this.botRespawnTimer -= realDelta
      if (this.botRespawnTimer <= 0) {
        this.botRespawnTimer = null
        this.spawnBot()
      }
    }

    this.time += delta
  }

  private spawnBot(): void {
    const bot = new Tank({ side: 'bot', level: 'basic', direction: 'left', x: 5.5 * B, y: 0.5 * B })
    this.flickers.push(new Flicker(bot, 1.5))
  }
}
