import {
  BLOCK_SIZE,
  BOT_FLICKER_DURATION,
  BOT_SPAWN_X,
  botSpawnInterval,
  HELMET_POWERUP_DURATION,
  LIFE_BONUS_SCORE,
  MAX_BOT_ON_FIELD,
  POWER_UP_BOT_INDICES,
  POWER_UP_SCORE,
  SCORE_POPUP_DURATION,
  SHOVEL_BLINK_INTERVAL,
  SHOVEL_BLINK_TIMES,
  SHOVEL_STEEL_DURATION,
  SPAWN_HELMET_DURATION,
  STAR_ARMOR_SCORE,
  TANK_KILL_SCORE_MAP,
  TIMER_FREEZE_TICK,
  TIMER_FREEZE_TICKS,
} from './constants'
import Tank from './entities/Tank'
import type Bullet from './entities/Bullet'
import Explosion, { BIG_EXPLOSION_DURATION } from './entities/Explosion'
import Flicker, { FLICKER_DURATION } from './entities/Flicker'
import PowerUp from './entities/PowerUp'
import ScorePopup from './entities/ScorePopup'
import type TerrainMap from './map/TerrainMap'
import type { CollisionWorld } from './physics/collision'
import { testCollide, type Rect } from './physics/geometry'
import BotBrain from './ai/bot-brain'
import type { AIContext, TankController, TankIntent } from './ai/controller'
import TeammateBrain from './ai/teammate-brain'
import { buildSpots, type Spot } from './ai/spots'
import { updateBullets, type BulletTankHit } from './systems/bullet'
import { updateAnimations } from './systems/animation'
import { fireTank } from './systems/fire'
import { keyboardController } from './systems/input'
import { applyInput, applyPlayerMove } from './systems/movement'
import { determinePowerUpName, updatePowerUps, validPowerUpPositions } from './systems/powerup'
import type { PlayerState, SessionOptions } from './GameSession'
import {
  bulletSnapshot,
  powerUpSnapshot,
  round,
  tankSnapshot,
  terrainSnapshot,
  type SceneSnapshot,
} from './snapshot'
import { emptyCounts } from './StatisticsAnimation'
import type InputManager from '../input/InputManager'
import type { AudioPort, TankLevel } from './types'

const TANK_UPGRADE: Record<TankLevel, TankLevel> = {
  basic: 'fast',
  fast: 'power',
  power: 'armor',
  armor: 'armor',
}

type ShovelPhase = 'none' | 'steel' | 'blink'

export type StageStatus = 'playing' | 'won' | 'lost'
export type LoseReason = 'dead' | 'eagle'

/** 队友命中的冻结时长（ms） */
const FREEZE_DURATION = 1000

interface PlayerSlot {
  state: PlayerState
  /** 出生闪烁结束后才有值；有值即可以操作 */
  tank: Tank | null
  /** 正在出生的坦克，闪烁结束后成为 tank */
  flicker: Flicker | null
  /** >0：等待复活计时（爆炸播完才开始出生） */
  respawnTimer: number
  /** 托管时驾驶坦克的 AI；交还或换了一辆坦克时丢弃 */
  brain: TankController | null
}

/**
 * 一关的世界状态 + Systems 管线；跨关状态与关卡流程由 GameSession 管理。
 * 管线顺序：Input/AI → Movement → Fire → Bullet（含命中结算）→ Explosion → Spawn → 胜负。
 */
export default class BattleScene {
  readonly map: TerrainMap
  readonly tanks: Tank[] = []
  readonly bullets: Bullet[] = []
  readonly explosions: Explosion[] = []
  readonly powerUps: PowerUp[] = []
  readonly scorePopups: ScorePopup[] = []
  private readonly players: PlayerSlot[]
  /** 本关各玩家按等级的击杀数（结算页用，下标与 players 一致） */
  readonly killInfo: Record<TankLevel, number>[]

  /** bot 全体冻结的剩余计数（timer 道具），>0 时 bot 不动不开火 */
  private botFreezeTicks = 0
  /** shovel 道具状态机 */
  private shovelPhase: ShovelPhase = 'none'
  private shovelTimer = 0
  private shovelBlinkToggles = 0
  private shovelSteelShown = false
  private readonly brains = new Map<number, BotBrain>()
  /** 各坦克本 tick 的操作，只给快照用 */
  private readonly intents = new Map<number, TankIntent>()
  private readonly audio: AudioPort

  /** 缓存的 spot 图，地形变动（version 改变）时重建 */
  private spotsCache: Spot[] | null = null
  private spotsVersion = -1

  /** 待出场的 bot 等级队列 */
  private readonly remainingBots: TankLevel[]
  /** 已出场 bot 计数（用于道具下标判定） */
  private spawnedBotCount = 0
  /** 阵亡 bot 在爆炸（和得分弹出）播完前仍占着同屏名额，这里记各自的剩余时间 */
  private readonly dyingBotTimers: number[] = []
  private readonly botFlickers: Flicker[] = []
  private readonly maxBotsOnField: number
  private readonly botSpawnInterval: number
  private readonly stageNumber: number
  /** 距下次允许出生的剩余时间；为 0 时一有空位就出生 */
  private botSpawnTimer = 0
  private nextBotSpawnIndex = 0

  time = 0
  status: StageStatus = 'playing'
  loseReason: LoseReason | null = null

  constructor(
    map: TerrainMap,
    audio: AudioPort,
    botGroups: TankLevel[],
    players: PlayerState[],
    /** 关卡序号，从 1 开始，决定出生间隔 */
    stageNumber: number,
    private readonly options: SessionOptions,
  ) {
    this.map = map
    this.audio = audio
    this.remainingBots = [...botGroups]
    this.players = players.map((state) => ({
      state,
      tank: null,
      flicker: null,
      respawnTimer: 0,
      brain: null,
    }))
    this.killInfo = players.map(() => emptyCounts(0))
    const multi = players.length > 1
    this.maxBotsOnField = multi ? MAX_BOT_ON_FIELD.multi : MAX_BOT_ON_FIELD.single
    this.botSpawnInterval = botSpawnInterval(stageNumber, multi)
    this.stageNumber = stageNumber
  }

  /** 开战：玩家开始出生，第一辆 bot 在下一次 step 立即出生 */
  start(): void {
    for (const slot of this.players) {
      this.spawnPlayer(slot)
    }
  }

  /** 过关：存活（或正在出生）坦克的等级留到下一关，并移出战场（旧版 reserveTankOnStageEnd） */
  reserveTanks(): void {
    for (const slot of this.players) {
      const tank = slot.tank ?? slot.flicker?.tank
      if (tank != null && tank.alive) {
        slot.state.reservedTankLevel = tank.level
        tank.alive = false
      }
      slot.tank = null
      slot.flicker = null
    }
    this.cleanupTanks()
  }

  get flickers(): Flicker[] {
    const result: Flicker[] = []
    for (const slot of this.players) {
      if (slot.flicker != null) result.push(slot.flicker)
    }
    result.push(...this.botFlickers)
    return result
  }

  /** 各玩家剩余命数 */
  get lives(): number[] {
    return this.players.map((p) => p.state.lives)
  }

  /** 该玩家的坦克在场且出生闪烁已结束 */
  controllable(playerIndex: number): boolean {
    return this.players[playerIndex].tank != null
  }

  /** 尚未开始出生的 bot 数（HUD 右侧的小坦克图标） */
  get remainingBotCount(): number {
    return this.remainingBots.length
  }

  private get world(): CollisionWorld {
    return { map: this.map, tanks: this.tanks, restrictedAreas: this.flickers.map((f) => f.rect()) }
  }

  /** 取（必要时重建）spot 图 */
  private get spots(): Spot[] {
    if (this.spotsCache == null || this.spotsVersion !== this.map.version) {
      this.spotsCache = buildSpots(this.map)
      this.spotsVersion = this.map.version
    }
    return this.spotsCache
  }

  private aliveBotCount(): number {
    let n = 0
    for (const t of this.tanks) {
      if (t.alive && t.side === 'bot') n += 1
    }
    return n
  }

  // region 出生
  private spawnPlayer(slot: PlayerSlot): void {
    const { state } = slot
    let level: TankLevel = 'basic'
    if (state.reservedTankLevel != null) {
      level = state.reservedTankLevel
      state.reservedTankLevel = null
    } else if (state.lives > 0) {
      state.lives -= 1
    } else {
      return
    }
    const tank = new Tank({
      side: 'player',
      level,
      color: state.color,
      direction: 'up',
      x: state.spawnPos.x,
      y: state.spawnPos.y,
      hp: 1,
      helmetDuration: SPAWN_HELMET_DURATION,
    })
    slot.flicker = new Flicker(tank)
    slot.respawnTimer = 0
    slot.brain = null
  }

  /** 出生计时只在真正出生时重置：满员时停在 0，一有空位就出生 */
  private updateBotSpawn(delta: number): void {
    if (this.botSpawnTimer > 0) {
      this.botSpawnTimer = Math.max(0, this.botSpawnTimer - delta)
      return
    }
    const inUse = this.aliveBotCount() + this.botFlickers.length + this.dyingBotTimers.length
    if (this.remainingBots.length === 0 || inUse >= this.maxBotsOnField) {
      return
    }
    this.spawnBot()
    this.botSpawnTimer = this.botSpawnInterval
  }

  /** 出生点轮流使用且不检查占用，与已有坦克重叠也照样出生 */
  private spawnBot(): void {
    const x = BOT_SPAWN_X[this.nextBotSpawnIndex]
    this.nextBotSpawnIndex = (this.nextBotSpawnIndex + 1) % BOT_SPAWN_X.length
    const level = this.remainingBots.shift()!
    const withPowerUp = POWER_UP_BOT_INDICES.includes(this.spawnedBotCount)
    if (withPowerUp) {
      // 新的携带道具 bot 出场时，清除场上已有道具
      this.powerUps.length = 0
    }
    this.spawnedBotCount += 1
    const tank = new Tank({
      side: 'bot',
      level,
      color: 'silver',
      direction: 'down',
      x,
      y: 0,
      hp: level === 'armor' ? 4 : 1,
      withPowerUp,
    })
    this.botFlickers.push(new Flicker(tank, FLICKER_DURATION / BOT_FLICKER_DURATION))
  }

  /** 推进出生闪烁，播完的坦克进入战场 */
  private updateFlickers(delta: number): void {
    for (const slot of this.players) {
      const flicker = slot.flicker
      if (flicker == null) continue
      flicker.advance(delta)
      if (flicker.done) {
        this.placeTank(flicker.tank)
        slot.tank = flicker.tank
        slot.flicker = null
      }
    }
    for (const flicker of this.botFlickers) {
      flicker.advance(delta)
      if (flicker.done) {
        this.placeTank(flicker.tank)
        this.brains.set(flicker.tank.tankId, new BotBrain())
      }
    }
    const pending = this.botFlickers.filter((f) => !f.done)
    this.botFlickers.splice(0, this.botFlickers.length, ...pending)
  }

  private placeTank(tank: Tank): void {
    tank.bornAt = this.time
    this.tanks.push(tank)
  }
  // endregion

  // region 命中结算
  private addScore(slot: PlayerSlot, amount: number): void {
    const { state } = slot
    const before = state.score
    state.score += amount
    const bonus = Math.floor(state.score / LIFE_BONUS_SCORE) - Math.floor(before / LIFE_BONUS_SCORE)
    if (bonus > 0) {
      state.lives += bonus
    }
  }

  private countKill(slot: PlayerSlot, level: TankLevel): void {
    this.killInfo[this.players.indexOf(slot)][level] += 1
  }

  private playerSlotOfTank(tankId: number): PlayerSlot | null {
    return this.players.find((p) => p.tank != null && p.tank.tankId === tankId) ?? null
  }

  private killBot(bot: Tank, shooterId: number): void {
    bot.alive = false
    this.explosions.push(new Explosion({ x: bot.x + 8, y: bot.y + 8 }, 'big'))
    this.audio.play('explosion_1')
    const score = TANK_KILL_SCORE_MAP[bot.level]
    // 射手已阵亡时不计分，但分数照常弹出（旧版计分和弹出分属不同 saga）
    this.scorePopups.push(new ScorePopup(score, bot.x, bot.y, BIG_EXPLOSION_DURATION))
    const shooter = this.playerSlotOfTank(shooterId)
    if (shooter != null) {
      this.countKill(shooter, bot.level)
      this.addScore(shooter, score)
    }
    this.dyingBotTimers.push(BIG_EXPLOSION_DURATION + SCORE_POPUP_DURATION)
  }

  private spawnPowerUp(): void {
    const playerTanks = this.players.map((p) => p.tank).filter((t): t is Tank => t != null)
    const { random } = this.options
    const name = determinePowerUpName(this.map, playerTanks, random)
    const positions = validPowerUpPositions(this.map)
    const pos =
      positions.length > 0
        ? positions[Math.floor(random() * positions.length)]
        : {
            x: (Math.floor(random() * 25) / 2) * BLOCK_SIZE,
            y: (Math.floor(random() * 25) / 2) * BLOCK_SIZE,
          }
    this.powerUps.push(new PowerUp(name, pos.x, pos.y))
    this.audio.play('powerup_appear')
  }

  private killPlayer(slot: PlayerSlot): void {
    const tank = slot.tank
    if (tank == null) {
      return
    }
    tank.alive = false
    this.explosions.push(new Explosion({ x: tank.x + 8, y: tank.y + 8 }, 'big'))
    this.audio.play('explosion_1')
    slot.tank = null
    slot.respawnTimer = BIG_EXPLOSION_DURATION
  }

  private applyHit(hit: BulletTankHit): void {
    const target = hit.target
    if (!target.alive) {
      return
    }
    if (hit.bullet.side === 'player') {
      if (target.side === 'bot') {
        // 携带道具的 bot 被击中（不必击毁）就掉落道具
        if (target.withPowerUp) {
          target.withPowerUp = false
          this.spawnPowerUp()
        }
        target.hp -= 1
        if (target.hp <= 0) {
          this.killBot(target, hit.bullet.tankId)
        }
      } else {
        // player → player（队友）：冻结 + 闪烁
        target.frozenTimeout = FREEZE_DURATION
      }
    } else {
      // bot → player（无头盔已在 bullet 系统过滤）
      const slot = this.players.find((p) => p.tank === target)
      if (slot != null) {
        this.killPlayer(slot)
      }
    }
  }
  // endregion

  private aiContext(): AIContext {
    return {
      world: this.world,
      map: this.map,
      tanks: this.tanks,
      bullets: this.bullets,
      powerUps: this.powerUps,
      spots: this.spots,
      random: this.options.random,
      time: this.time,
      stageNumber: this.stageNumber,
      players: this.players.map((slot) => slot.tank),
      pilots: this.players.map((slot) => slot.state.pilot),
    }
  }

  /** 玩家和 bot 共用的执行顺序：移动 → 计时 → 开火。冰面滑行等玩家规则只在 applyPlayerMove 里 */
  private drive(tank: Tank, controller: TankController, ctx: AIContext, delta: number): void {
    const move = controller.move(tank, ctx, delta)
    if (tank.side === 'player') {
      applyPlayerMove(ctx.world, tank, move, delta, this.audio)
    } else {
      applyInput(ctx.world, tank, move, delta)
    }
    this.decayTimers(tank, delta)
    const fire = controller.fire(tank, ctx, delta)
    fireTank(tank, fire, delta, this.bullets, this.audio)
    this.intents.set(tank.tankId, { move, fire })
  }

  private playerController(slot: PlayerSlot, input: InputManager): TankController {
    if (slot.state.pilot === 'human') {
      slot.brain = null
      return keyboardController(input, slot.state.control)
    }
    slot.brain ??= new TeammateBrain()
    return slot.brain
  }

  /** 推进一个定步 */
  step(delta: number, input: InputManager): void {
    // Input/AI → Movement → Fire
    const ctx = this.aiContext()
    for (const slot of this.players) {
      const tank = slot.tank
      if (tank == null || !tank.alive) {
        continue
      }
      this.drive(tank, this.playerController(slot, input), ctx, delta)
    }
    const botsFrozen = this.botFreezeTicks > 0
    for (const tank of this.tanks) {
      if (tank.side !== 'bot' || !tank.alive) {
        continue
      }
      if (botsFrozen) {
        tank.moving = false
        this.intents.delete(tank.tankId)
        continue
      }
      const brain = this.brains.get(tank.tankId)
      if (brain != null) {
        this.drive(tank, brain, ctx, delta)
      }
    }
    const freezeTickCrossed =
      Math.floor((this.time + delta) / TIMER_FREEZE_TICK) >
      Math.floor(this.time / TIMER_FREEZE_TICK)
    if (this.botFreezeTicks > 0 && freezeTickCrossed) {
      this.botFreezeTicks -= 1
    }

    // Bullet（含命中结算）→ Explosion
    const hits: BulletTankHit[] = []
    const { bullets, map, explosions, audio, tanks } = this
    for (const tankId of updateBullets(bullets, map, explosions, audio, delta, tanks, hits)) {
      this.brains.get(tankId)?.onBaseHit()
    }
    for (const hit of hits) {
      this.applyHit(hit)
    }
    updateAnimations(this.explosions, delta)
    updateAnimations(this.scorePopups, delta)

    // PowerUp：闪烁 + 拾取 + shovel 时序
    updatePowerUps(this.powerUps, delta)
    this.handlePickup()
    this.updateShovel(delta)

    // Spawn（出生闪烁 → bot 补位 → 玩家复活）
    this.updateFlickers(delta)
    this.updateDyingBots(delta)
    this.updateBotSpawn(delta)
    for (const slot of this.players) {
      if (slot.respawnTimer > 0) {
        slot.respawnTimer -= delta
        if (slot.respawnTimer <= 0) {
          this.spawnPlayer(slot)
        }
      }
    }
    this.borrowLives(input)

    // Cleanup：移除阵亡坦克
    this.cleanupTanks()

    // 胜负判定：结果只判定一次，之后战场照常运行（旧版出结果后还有一段延时）
    if (this.status === 'playing') {
      this.judge()
    }

    this.time += delta
  }

  /** 本关状态的纯数据快照，测试断言和调试用 */
  snapshot(): SceneSnapshot {
    return {
      time: round(this.time),
      status: this.status,
      loseReason: this.loseReason,
      remainingBots: this.remainingBots.length,
      botsFrozen: this.botFreezeTicks > 0,
      terrain: terrainSnapshot(this.map),
      eagle:
        this.map.eagle == null
          ? null
          : { x: this.map.eagle.x, y: this.map.eagle.y, broken: this.map.eagleBroken },
      slots: this.players.map((slot) => ({
        tankId: slot.tank?.tankId ?? null,
        state:
          slot.tank != null
            ? 'alive'
            : slot.flicker != null
              ? 'spawning'
              : slot.respawnTimer > 0
                ? 'respawning'
                : 'out',
      })),
      tanks: this.tanks.map((t) => tankSnapshot(t, this.intents.get(t.tankId) ?? null)),
      spawning: this.flickers.map((f) => ({ side: f.tank.side, x: f.x, y: f.y })),
      bullets: this.bullets.map(bulletSnapshot),
      powerUps: this.powerUps.map(powerUpSnapshot),
    }
  }

  // region 道具拾取与效果
  private handlePickup(): void {
    for (const p of this.powerUps) {
      if (p.dead) {
        continue
      }
      for (const slot of this.players) {
        const tank = slot.tank
        if (tank == null || !tank.alive) {
          continue
        }
        if (testCollide(p.rect(), tank.rect())) {
          p.dead = true
          this.audio.play('powerup_pick')
          this.addScore(slot, POWER_UP_SCORE)
          this.scorePopups.push(new ScorePopup(POWER_UP_SCORE, p.x, p.y))
          this.applyPowerUp(p.name, slot, tank)
          break
        }
      }
    }
  }

  private applyPowerUp(name: PowerUp['name'], slot: PlayerSlot, tank: Tank): void {
    switch (name) {
      case 'tank':
        slot.state.lives += 1
        break
      case 'star':
        if (tank.level === 'armor') {
          this.addScore(slot, STAR_ARMOR_SCORE)
        } else {
          tank.level = TANK_UPGRADE[tank.level]
        }
        break
      case 'grenade':
        // grenade 击杀计入击杀数但不加分（旧版 killBotHandler 只在 method=bullet 时加分）
        for (const t of this.tanks) {
          if (t.side === 'bot' && t.alive) {
            t.alive = false
            this.countKill(slot, t.level)
            this.explosions.push(new Explosion({ x: t.x + 8, y: t.y + 8 }, 'big'))
            this.dyingBotTimers.push(BIG_EXPLOSION_DURATION)
          }
        }
        this.audio.play('explosion_1')
        break
      case 'timer':
        this.botFreezeTicks = TIMER_FREEZE_TICKS
        break
      case 'helmet':
        tank.helmetDuration = HELMET_POWERUP_DURATION
        break
      case 'shovel':
        this.startShovel()
        break
    }
  }

  private shovelExcludes(): Rect[] {
    const excludes: Rect[] = []
    if (this.map.eagle != null) {
      excludes.push({
        x: this.map.eagle.x,
        y: this.map.eagle.y,
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
      })
    }
    for (const t of this.tanks) {
      if (t.alive) {
        excludes.push(t.rect())
      }
    }
    return excludes
  }

  private startShovel(): void {
    this.map.shovelConvert('steel', this.shovelExcludes())
    this.shovelPhase = 'steel'
    this.shovelTimer = SHOVEL_STEEL_DURATION
    this.shovelSteelShown = true
    this.shovelBlinkToggles = 0
  }

  private updateShovel(delta: number): void {
    if (this.shovelPhase === 'none') {
      return
    }
    this.shovelTimer -= delta
    if (this.shovelTimer > 0) {
      return
    }
    if (this.shovelPhase === 'steel') {
      this.shovelPhase = 'blink'
      this.shovelTimer = SHOVEL_BLINK_INTERVAL
      return
    }
    // blink：交替 steel / brick，共 SHOVEL_BLINK_TIMES 次往返
    this.shovelSteelShown = !this.shovelSteelShown
    this.map.shovelConvert(this.shovelSteelShown ? 'steel' : 'brick', this.shovelExcludes())
    this.shovelBlinkToggles += 1
    this.shovelTimer = SHOVEL_BLINK_INTERVAL
    if (this.shovelBlinkToggles >= SHOVEL_BLINK_TIMES * 2) {
      this.map.shovelConvert('brick', this.shovelExcludes())
      this.shovelPhase = 'none'
    }
  }
  // endregion

  /** 递减坦克的头盔/冻结计时，并处理冻结闪烁 */
  private decayTimers(tank: Tank, delta: number): void {
    if (tank.helmetDuration > 0) {
      tank.helmetDuration = Math.max(0, tank.helmetDuration - delta)
    }
    if (tank.frozenTimeout > 0) {
      tank.frozenTimeout = Math.max(0, tank.frozenTimeout - delta)
      tank.visible = Math.floor(this.time / 150) % 2 === 0
      if (tank.frozenTimeout === 0) {
        tank.visible = true
      }
    } else {
      tank.visible = true
    }
  }

  /** 各玩家此刻能否按开火键向队友借命，界面据此显示提示 */
  get canBorrowLife(): boolean[] {
    return this.players.map((slot) => this.lenderOf(slot) != null)
  }

  /** 不在场、没命的玩家可以向还有命的队友借一条 */
  private lenderOf(slot: PlayerSlot): PlayerSlot | null {
    if (slot.tank != null || slot.flicker != null || slot.state.lives > 0) {
      return null
    }
    return this.players.find((p) => p !== slot && p.state.lives > 0) ?? null
  }

  /** 双人模式：没命的玩家按开火键向队友借一条命（旧版 borrowLifeWatcher） */
  private borrowLives(input: InputManager): void {
    for (const slot of this.players) {
      const lender = this.lenderOf(slot)
      if (lender != null && input.firePressed(slot.state.control)) {
        lender.state.lives -= 1
        slot.state.lives += 1
        this.spawnPlayer(slot)
      }
    }
  }

  private updateDyingBots(delta: number): void {
    for (let i = this.dyingBotTimers.length - 1; i >= 0; i -= 1) {
      this.dyingBotTimers[i] -= delta
      if (this.dyingBotTimers[i] <= 0) {
        this.dyingBotTimers.splice(i, 1)
      }
    }
  }

  private cleanupTanks(): void {
    let w = 0
    for (let r = 0; r < this.tanks.length; r += 1) {
      const t = this.tanks[r]
      if (t.alive) {
        this.tanks[w++] = t
      } else {
        this.brains.delete(t.tankId)
        this.intents.delete(t.tankId)
      }
    }
    this.tanks.length = w
  }

  private judge(): void {
    if (this.map.eagleBroken) {
      this.status = 'lost'
      this.loseReason = 'eagle'
      return
    }
    const allPlayersOut = this.players.every(
      (p) => p.tank == null && p.flicker == null && p.state.lives <= 0 && p.respawnTimer <= 0,
    )
    if (this.players.length > 0 && allPlayersOut) {
      this.status = 'lost'
      this.loseReason = 'dead'
      return
    }
    if (
      this.remainingBots.length === 0 &&
      this.botFlickers.length === 0 &&
      this.aliveBotCount() === 0
    ) {
      this.status = 'won'
    }
  }
}
