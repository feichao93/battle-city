import { BLOCK_SIZE } from '../constants'
import type Tank from '../entities/Tank'
import { testCollide } from '../physics/geometry'
import type { Direction, Input } from '../types'
import { bulletInterval, bulletLimit } from '../values'
import type { AIContext, TankController } from './controller'
import { digDistances, digPath } from './dig-path'
import { determineFire, getEnv, RelativePosition } from './env'
import { calculateFireEstimateMap, getAIFireCount, getFireResist } from './fire-estimate'
import { openLane, scanLane, shouldDig } from './lane'
import PathFollower from './path-follower'
import { findPath } from './pathfinding'
import { around, getTankSpot, type Spot } from './spots'

/**
 * 进攻老鹰时一层砖折算成多走几格。比 TeammateBrain 贵得多：只在打砖能省下一大截、
 * 或者出生的地方被砖隔开走不过去时才打，免得 bot 太强
 */
const DIG_LAYER_COST = 6

/**
 * 每次规划时去打老鹰的概率，本关开始后 ATTACK_RAMP 内从 0 升到 ATTACK_CHANCE：
 * 开局多游荡、后面才冲老鹰，和 NES 一样越往后越凶，免得刚开局老鹰就被冲掉
 */
const ATTACK_CHANCE = 0.2
const ATTACK_RAMP = 60_000

/** 侧面或背后这么远以内、中间没有砖钢挡着的玩家，才考虑转过去打 */
const AIM_RANGE = 6 * BLOCK_SIZE
/**
 * 每次开火判定时转身打这样的玩家的概率，本关开始后 AIM_RAMP 内从 0 升到 AIM_CHANCE：
 * 不然站在 bot 侧面就绝对安全；开局不转，免得一出生就被围着打
 */
const AIM_CHANCE = 0.05
const AIM_RAMP = 60_000
/** 转过去以后停下开火的时间 */
const AIM_HOLD = 300

/**
 * 打中老鹰外墙或老鹰后，这辆 bot 这么久不朝老鹰开火、不去打老鹰：
 * 不然第一发开出缺口、紧接着一发就打掉老鹰，游戏结束得太快
 */
const BASE_HIT_PENALTY = 3000

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

/** 本关开始后 ramp 内从 0 线性升到 max */
function rampedChance(max: number, ramp: number, time: number): number {
  return max * Math.min(1, time / ramp)
}

type Phase = 'planning' | 'following' | 'attackTurning' | 'attackFiring' | 'waiting'

function randomPassableSpot(spots: Spot[], random: () => number): number {
  for (let i = 0; i < 1000; i += 1) {
    const t = Math.floor(random() * spots.length)
    if (spots[t].canPass) {
      return t
    }
  }
  return spots.findIndex((s) => s.canPass)
}

/**
 * 单个 bot 的帧循环状态机，等价于旧 saga 的 wander / attackEagle / blocked。
 * - simpleFireLoop：移动期间按概率开火
 * - blocked：连续 200ms 未位移则放弃当前路径重规划
 * - 进攻路线打砖更近（或只能打砖过去）时走打砖路线，路上遇到砖停下开火
 */
export default class BotBrain implements TankController {
  private phase: Phase = 'planning'
  private readonly follower = new PathFollower()
  private goalIsEagle = false
  /** 当前路线要打砖 */
  private digRoute = false
  private digging = false

  private fireTimer = 300
  private attackFireCount = 0

  private waitTimer = 0
  /** 正在转身打的方向和剩余时间 */
  private aimDirection: Direction | null = null
  private aimTimer = 0
  /** 见 BASE_HIT_PENALTY */
  private basePenalty = 0

  /** 这辆 bot 的子弹打掉了老鹰外墙的砖或打中老鹰 */
  onBaseHit(): void {
    this.basePenalty = BASE_HIT_PENALTY
  }

  move(tank: Tank, ctx: AIContext, delta: number): Input | null {
    this.basePenalty = Math.max(0, this.basePenalty - delta)
    if (this.aimDirection != null) {
      this.aimTimer -= delta
      if (this.aimTimer > 0) {
        // 不交给 PathFollower，免得停下来被当成受阻；时间到了它会自己转回路线方向
        return tank.direction === this.aimDirection
          ? null
          : { type: 'turn', direction: this.aimDirection }
      }
      this.aimDirection = null
    }
    switch (this.phase) {
      case 'planning':
        this.plan(tank, ctx)
        return null
      case 'following': {
        this.digging =
          this.digRoute && this.follower.advancing(tank) != null && shouldDig(ctx.map, tank)
        if (this.digging) {
          return null
        }
        const { move, status } = this.follower.step(tank, delta)
        if (status === 'blocked') {
          this.plan(tank, ctx)
        } else if (status === 'arrived') {
          this.arrive()
        }
        return move
      }
      case 'attackTurning':
        this.phase = 'attackFiring'
        if (ctx.map.eagle == null) {
          return null
        }
        return {
          type: 'turn',
          direction: new RelativePosition(tank, ctx.map.eagle).getPrimaryDirection(),
        }
      case 'attackFiring':
        return null
      case 'waiting':
        this.waitTimer -= delta
        if (this.waitTimer <= 0) {
          this.phase = 'planning'
        }
        return null
    }
  }

  fire(tank: Tank, ctx: AIContext, delta: number): boolean {
    return this.wantFire(tank, ctx, delta) && !(this.basePenalty > 0 && this.aimsAtBase(tank, ctx))
  }

  private wantFire(tank: Tank, ctx: AIContext, delta: number): boolean {
    if (this.phase === 'following' && this.digging) {
      return true
    }
    if (this.aimDirection != null) {
      return tank.direction === this.aimDirection
    }
    return this.phase === 'attackFiring'
      ? this.attackFire(tank, ctx)
      : this.simpleFire(tank, ctx, delta)
  }

  private plan(tank: Tank, ctx: AIContext): void {
    const start = getTankSpot(tank)
    const attack = ctx.random() < rampedChance(ATTACK_CHANCE, ATTACK_RAMP, ctx.time)
    if (attack && this.basePenalty <= 0 && ctx.map.eagle != null && !ctx.map.eagleBroken) {
      this.goalIsEagle = true
      const eagleSpot = getTankSpot(ctx.map.eagle)
      const weakSpots = around(eagleSpot)
      const estMap = calculateFireEstimateMap(weakSpots, ctx.map)
      const candidates = [...estMap.keys()].filter(
        (t) => ctx.spots[t]?.canPass && getFireResist(estMap.get(t)!) <= 8,
      )
      if (candidates.length > 0) {
        const target = candidates[Math.floor(ctx.random() * candidates.length)]
        this.attackFireCount = getAIFireCount(estMap.get(target)!)
        const walk = findPath(ctx.spots, start, target)
        const dig = digDistances(ctx.map, start, { layerCost: DIG_LAYER_COST })
        this.digRoute = dig.dist[target] < (walk == null ? Infinity : walk.length - 1)
        this.beginPath(tank, this.digRoute ? digPath(dig, target) : walk)
        return
      }
    }
    // wander
    this.goalIsEagle = false
    this.digRoute = false
    const path = findPath(ctx.spots, start, randomPassableSpot(ctx.spots, ctx.random))
    this.beginPath(tank, path)
  }

  private beginPath(tank: Tank, path: number[] | null): void {
    if (!this.follower.begin(tank, path)) {
      this.phase = 'waiting'
      this.waitTimer = 200
    } else if (this.follower.done) {
      this.arrive()
    } else {
      this.phase = 'following'
    }
  }

  private arrive(): void {
    this.phase = this.goalIsEagle ? 'attackTurning' : 'planning'
  }

  private simpleFire(tank: Tank, ctx: AIContext, delta: number): boolean {
    this.fireTimer -= delta
    if (this.fireTimer > 0) {
      return false
    }
    this.fireTimer = bulletInterval(tank)
    const aim = this.phase === 'following' ? this.sideTarget(tank, ctx) : null
    if (aim != null && ctx.random() < rampedChance(AIM_CHANCE, AIM_RAMP, ctx.time)) {
      this.aimDirection = aim
      this.aimTimer = AIM_HOLD
      return false
    }
    return determineFire(tank, getEnv(ctx.map, ctx.tanks, tank), ctx.random)
  }

  /** 炮口以外的方向上，AIM_RANGE 以内开火打得到的玩家所在方向 */
  private sideTarget(tank: Tank, ctx: AIContext): Direction | null {
    for (const direction of DIRECTIONS) {
      if (direction === tank.direction) continue
      const lane = openLane(ctx.map, tank, direction, AIM_RANGE)
      if (
        lane != null &&
        ctx.tanks.some((t) => t.side === 'player' && t.alive && testCollide(lane, t.rect(), -0.01))
      ) {
        return direction
      }
    }
    return null
  }

  /** 这一枪打到的是老鹰外墙或老鹰；bot 子弹穿过 bot，所以只看玩家挡没挡着 */
  private aimsAtBase(tank: Tank, ctx: AIContext): boolean {
    const players = ctx.tanks.filter((t) => t.side === 'player')
    return scanLane(ctx.map, players, tank, tank, tank.direction).hit.kind === 'eagle'
  }

  private attackFire(tank: Tank, ctx: AIContext): boolean {
    if (this.attackFireCount <= 0 || this.basePenalty > 0) {
      this.phase = 'planning'
      return false
    }
    const active = ctx.bullets.filter((b) => b.tankId === tank.tankId && !b.dead).length
    const canFire = tank.cooldown <= 0 && active < bulletLimit(tank)
    if (canFire) {
      this.attackFireCount -= 1
    }
    return canFire
  }
}
