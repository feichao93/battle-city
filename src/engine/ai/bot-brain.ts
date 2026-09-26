import { BLOCK_TIMEOUT } from '../constants'
import type Bullet from '../entities/Bullet'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import type { CollisionWorld } from '../physics/collision'
import { getDirectionInfo } from '../physics/geometry'
import { applyInput } from '../systems/movement'
import { fireTank } from '../systems/fire'
import type { AudioPort, Direction } from '../types'
import { bulletInterval, bulletLimit } from '../values'
import { determineFire, getEnv, RelativePosition } from './env'
import { calculateFireEstimateMap, getAIFireCount, getFireResist } from './fire-estimate'
import { findPath } from './pathfinding'
import { around, getTankSpot, spotToTankPos, type Spot } from './spots'

/** bot 决策所需的世界上下文 */
export interface BotContext {
  world: CollisionWorld
  map: TerrainMap
  tanks: Tank[]
  bullets: Bullet[]
  audio: AudioPort
  spots: Spot[]
}

type Phase = 'planning' | 'turning' | 'moving' | 'attackTurning' | 'attackFiring' | 'waiting'

const REACH_EPS = 0.5

function randomPassableSpot(spots: Spot[]): number {
  for (let i = 0; i < 1000; i += 1) {
    const t = Math.floor(Math.random() * spots.length)
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
 */
export default class BotBrain {
  private phase: Phase = 'planning'
  private path: number[] = []
  private pathIndex = 0
  private goalIsEagle = false

  private segDir: Direction = 'down'
  private segAxis: 'x' | 'y' = 'y'
  private segTarget = 0

  private fireTimer = 300
  private attackFireCount = 0
  private continuousWander = 0

  private waitTimer = 0
  private blockAcc = 0
  private lastX = 0
  private lastY = 0

  step(tank: Tank, ctx: BotContext, delta: number): void {
    // 移动/规划
    switch (this.phase) {
      case 'planning':
        this.plan(tank, ctx)
        break
      case 'turning':
        applyInput(ctx.world, tank, { type: 'turn', direction: this.segDir }, delta)
        this.phase = 'moving'
        break
      case 'moving':
        this.move(tank, ctx, delta)
        break
      case 'attackTurning': {
        if (ctx.map.eagle != null) {
          const dir = new RelativePosition(tank, ctx.map.eagle).getPrimaryDirection()
          applyInput(ctx.world, tank, { type: 'turn', direction: dir }, delta)
        }
        this.phase = 'attackFiring'
        break
      }
      case 'attackFiring':
        // 移动交给 fire 分支处理
        break
      case 'waiting':
        this.waitTimer -= delta
        if (this.waitTimer <= 0) {
          this.phase = 'planning'
        }
        break
    }

    // 开火
    if (this.phase === 'attackFiring') {
      this.attackFire(tank, ctx, delta)
    } else {
      this.simpleFire(tank, ctx, delta)
    }

    // blocked 检测（仅移动相关阶段）
    this.detectBlocked(tank, delta)
  }

  private plan(tank: Tank, ctx: BotContext): void {
    const start = getTankSpot(tank)
    const attack = Math.random() >= 0.9 - this.continuousWander * 0.02
    if (attack && ctx.map.eagle != null && !ctx.map.eagleBroken) {
      this.continuousWander = 0
      this.goalIsEagle = true
      const eagleSpot = getTankSpot(ctx.map.eagle)
      const weakSpots = around(eagleSpot)
      const estMap = calculateFireEstimateMap(weakSpots, ctx.map)
      const candidates = [...estMap.keys()].filter(
        (t) => ctx.spots[t]?.canPass && getFireResist(estMap.get(t)!) <= 8,
      )
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)]
        this.attackFireCount = getAIFireCount(estMap.get(target)!)
        const path = findPath(ctx.spots, start, target)
        this.beginPath(tank, path)
        return
      }
    }
    // wander
    this.continuousWander += 1
    this.goalIsEagle = false
    const path = findPath(ctx.spots, start, randomPassableSpot(ctx.spots))
    this.beginPath(tank, path)
  }

  private beginPath(tank: Tank, path: number[] | null): void {
    if (path == null || path.length < 2) {
      this.phase = 'waiting'
      this.waitTimer = 200
      return
    }
    this.path = path
    this.pathIndex = Math.max(0, path.indexOf(getTankSpot(tank)))
    this.nextSegment(tank)
  }

  private nextSegment(tank: Tank): void {
    if (this.pathIndex >= this.path.length - 1) {
      this.phase = this.goalIsEagle ? 'attackTurning' : 'planning'
      return
    }
    // 同向压缩：把朝同一方向的连续 spot 合并为一段
    const deltaStep = this.path[this.pathIndex + 1] - this.path[this.pathIndex]
    let step = 1
    while (
      this.pathIndex + step + 1 < this.path.length &&
      this.path[this.pathIndex + step + 1] - this.path[this.pathIndex + step] === deltaStep
    ) {
      step += 1
    }
    this.pathIndex += step
    const targetPos = spotToTankPos(this.path[this.pathIndex])
    const rel = new RelativePosition(tank, targetPos)
    this.segDir = rel.getPrimaryDirection()
    const { axis } = getDirectionInfo(this.segDir)
    this.segAxis = axis
    this.segTarget = targetPos[axis]
    this.phase = 'turning'
  }

  private move(tank: Tank, ctx: BotContext, delta: number): void {
    const remaining = this.segTarget - tank[this.segAxis]
    if (Math.abs(remaining) <= REACH_EPS) {
      tank[this.segAxis] = this.segTarget
      this.nextSegment(tank)
      return
    }
    applyInput(ctx.world, tank, { type: 'forward', maxDistance: Math.abs(remaining) }, delta)
  }

  private simpleFire(tank: Tank, ctx: BotContext, delta: number): void {
    this.fireTimer -= delta
    let shouldFire = false
    if (this.fireTimer <= 0) {
      this.fireTimer = bulletInterval(tank)
      shouldFire = determineFire(tank, getEnv(ctx.map, ctx.tanks, tank))
    }
    fireTank(tank, shouldFire, delta, ctx.bullets, ctx.audio)
  }

  private attackFire(tank: Tank, ctx: BotContext, delta: number): void {
    if (this.attackFireCount <= 0) {
      this.phase = 'planning'
      fireTank(tank, false, delta, ctx.bullets, ctx.audio)
      return
    }
    const active = ctx.bullets.filter((b) => b.tankId === tank.tankId && !b.dead).length
    const canFire = tank.cooldown <= 0 && active < bulletLimit(tank)
    fireTank(tank, canFire, delta, ctx.bullets, ctx.audio)
    if (canFire) {
      this.attackFireCount -= 1
    }
  }

  private detectBlocked(tank: Tank, delta: number): void {
    const moving = this.phase === 'moving' || this.phase === 'turning'
    if (moving && tank.frozenTimeout <= 0) {
      const moved = Math.abs(tank.x - this.lastX) + Math.abs(tank.y - this.lastY)
      if (moved <= 0.01) {
        this.blockAcc += delta
      } else {
        this.blockAcc = 0
      }
      if (this.blockAcc >= BLOCK_TIMEOUT) {
        this.blockAcc = 0
        this.phase = 'planning'
      }
    } else {
      this.blockAcc = 0
    }
    this.lastX = tank.x
    this.lastY = tank.y
  }
}
