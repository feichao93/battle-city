import { BLOCK_SIZE, FIELD_SIZE } from '../constants'
import type PowerUp from '../entities/PowerUp'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import { getDirectionInfo, testCollide } from '../physics/geometry'
import type { Direction, Input, Point } from '../types'
import type { AIContext, TankController } from './controller'
import {
  BRICK_LAYER_COST,
  digDistances,
  diggable,
  digPath,
  hasBricks,
  type DigGraph,
} from './dig-path'
import { defenseRoutes } from './defense'
import { RelativePosition } from './env'
import { scanLane, shouldDig } from './lane'
import PathFollower from './path-follower'
import { eagleReachSteps, eagleReachTime } from './eagle-threat'
import {
  avoidAim,
  counterFire,
  exposureCosts,
  holdBeforeAim,
  incomingBullet,
  stepsIntoBullet,
} from './self-defense'
import { N, spotToTankPos } from './spots'

const REPLAN_INTERVAL = 300
/** bot 这么久（ms）以内能走到打得到老鹰的位置，就优先打它 */
const EAGLE_THREAT_TIME = 4000
/** 打穿砖去打 bot 时，bot 不能太远，否则子弹多半打空 */
const MAX_FIRE_THROUGH_BRICK = 6 * BLOCK_SIZE
/** 射击位与 bot 的横向偏差，bot 会动，留得比子弹宽度紧 */
const ALIGN_TOLERANCE = 4
/** 以下都折算成「多走 / 少走几格」，和寻路代价比较 */
const DANGER_BONUS = 40
/** 没有真人时积极拿道具；有真人在场时留给真人 */
const POWER_UP_BONUS = { eager: 60, withHuman: 10 }
/** 单人时打通妨碍防守的砖，低于防守老鹰 */
const OPEN_DEFENSE_BONUS = 30
/** 双人时跑到对方那半边的代价：距离差不多时各管一边；再大两人都去追近处的 bot，胜率明显下降 */
const SIDE_PENALTY = 5
/** 守家位每偏 8px 的代价 */
const GUARD_OFFSET_COST = 4
/** 最多等这么久，免得被一辆不动的 bot 一直拦着 */
const MAX_AIM_WAIT = 1000
/** 被挡住后，挡路的地方这么久不走 */
const AVOID_DURATION = 2000
/** 要走却一直没挪动、也没在打砖：放弃目标附近 BAN_RADIUS 格一段时间 */
const STALL_LIMIT = 1500
const BAN_DURATION = 5000
const BAN_RADIUS = 2

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

interface Goal {
  spot: number
  /** 到位后朝哪个方向；null 表示不用转 */
  face: Direction | null
  cost: number
  /** 按哪张图走过去 */
  graph: DigGraph
  /** 走到 route[0] 后沿 route 走到 spot，而不是走最短路 */
  route?: number[]
}

/** 坦克所在的 spot；四舍五入的那格压到钢、河时，改用向下、向上取整得到的相邻格 */
function startSpot(map: TerrainMap, tank: Tank): number | null {
  const around = (v: number) => [
    Math.round((v + 8) / 8),
    Math.floor((v + 8) / 8),
    Math.ceil((v + 8) / 8),
  ]
  for (const row of around(tank.y)) {
    for (const col of around(tank.x)) {
      if (diggable(map, row * N + col)) return row * N + col
    }
  }
  return null
}

function tankRectAt(t: number) {
  return { ...spotToTankPos(t), width: BLOCK_SIZE, height: BLOCK_SIZE }
}

/** 停在这些 spot 上能吃到道具 */
function spotsOn(powerUp: PowerUp): number[] {
  const spots: number[] = []
  for (let t = 0; t < N * N; t += 1) {
    if (testCollide(powerUp.rect(), tankRectAt(t), -0.5)) spots.push(t)
  }
  return spots
}

function nearest(graph: DigGraph, spots: number[]): number {
  return Math.min(...spots.map((t) => graph.dist[t]))
}

function sidePenalty(pos: Point, side: number): number {
  const center = pos.x + BLOCK_SIZE / 2 - FIELD_SIZE / 2
  return side !== 0 && Math.sign(center) === -side ? SIDE_PENALTY : 0
}

/**
 * 托管玩家坦克的 AI。每 300ms 规划一次，在下面这些候选里取代价最小的作为目标：
 * - 射击位：与某辆 bot 同行或同列、子弹通道上先遇到 bot；很快就能打到老鹰的 bot 优先
 * - 道具：值得绕一段路去拿
 * - 单人时打通妨碍防守的砖（见 defenseRoutes），bot 从哪个方向打老鹰都赶得过去
 * - 都没有就回老鹰旁边守着
 * 去哪都可以打砖开路，打一层砖折算成多走几格；尽量不从 bot 炮口前面走。
 * 双人时 P1 偏左半场、P2 偏右半场。路线上有砖就停下打掉再走，被挡住就绕开挡路的地方。
 * 只输出意图，打滑等玩家规则由驱动层处理
 */
export default class TeammateBrain implements TankController {
  private readonly follower = new PathFollower()
  private goal: Goal | null = null
  private following = false
  /** 已经在目标上，或者没有目标 */
  private arrived = true
  private digging = false
  /** 正在对射抵消来弹，或者被 bot 正对着在调整站位；完了要按新位置重新规划 */
  private countering = false
  private evading = false
  /** 等子弹从前面过去 */
  private holding = false
  /** 已经在 bot 射线前等了多久 */
  private aimWait = 0
  /** 上次规划时有 bot 很快就能打到老鹰 */
  private eagleThreatened = false
  private replanTimer = 0
  private stall = 0
  private lastX = NaN
  private lastY = NaN
  /** spot → 到这个时刻（ctx.time）之前不再选它当目标 */
  private readonly banned = new Map<number, number>()
  /** spot → 到这个时刻之前寻路不经过它 */
  private readonly avoided = new Map<number, number>()

  move(tank: Tank, ctx: AIContext, delta: number): Input | null {
    this.watchStall(tank, ctx, delta)
    this.digging = false
    this.holding = false
    const threat = tank.helmetDuration > 0 ? null : incomingBullet(tank, ctx)
    const counter = threat == null ? null : counterFire(tank, ctx, threat)
    if (counter != null) {
      this.countering = true
      return counter.move
    }
    const evade = tank.helmetDuration > 0 ? undefined : avoidAim(tank, ctx)
    if (evade !== undefined) {
      this.evading = true
      return evade
    }
    if (this.countering || this.evading) {
      this.countering = false
      this.evading = false
      this.following = false
      this.replanTimer = 0
    }
    this.replanTimer -= delta
    if (this.replanTimer <= 0) {
      this.replanTimer = REPLAN_INTERVAL
      this.plan(tank, ctx)
    }
    if (this.following) {
      if (this.follower.advancing(tank) != null && shouldDig(ctx.map, tank)) {
        // 停下开火打砖；这段时间不交给 PathFollower，免得被当成卡住
        this.digging = true
        return null
      }
      if (this.follower.advancing(tank) != null && stepsIntoBullet(tank, ctx)) {
        // 同打砖：不交给 PathFollower，免得停下来被当成受阻
        this.holding = true
        return null
      }
      const heading = this.follower.heading()
      // 等它开过火、转开或者走开再过去；老鹰告急时不等
      const hold =
        heading == null || this.eagleThreatened ? undefined : holdBeforeAim(tank, ctx, heading)
      if (hold === undefined) {
        this.aimWait = 0
      } else if (this.aimWait < MAX_AIM_WAIT) {
        this.aimWait += delta
        this.holding = true
        return hold
      }
      const { move, status } = this.follower.step(tank, delta)
      if (status === 'blocked') {
        this.avoidAhead(tank, ctx)
        this.following = false
        this.replanTimer = 0
        return null
      }
      if (status === 'arrived') {
        this.following = false
        this.arrived = true
      }
      return move
    }
    if (this.goal?.face != null && tank.direction !== this.goal.face) {
      return { type: 'turn', direction: this.goal.face }
    }
    return null
  }

  fire(tank: Tank, ctx: AIContext): boolean {
    if (this.digging || this.countering) {
      // 打砖时子弹一出膛就打到砖，对射时要的是抵消来弹，前面是谁都不要紧
      return true
    }
    const { hit, bricks } = scanLane(ctx.map, ctx.tanks, tank, tank, tank.direction)
    return hit.kind === 'bot' && (bricks === 0 || hit.distance <= MAX_FIRE_THROUGH_BRICK)
  }

  /** 被 bot、队友或打不到的砖堵住时 PathFollower 会一直重试同一条路，这里负责换目标 */
  private watchStall(tank: Tank, ctx: AIContext, delta: number): void {
    const moved = tank.x !== this.lastX || tank.y !== this.lastY
    this.lastX = tank.x
    this.lastY = tank.y
    if (
      moved ||
      this.arrived ||
      this.digging ||
      this.countering ||
      this.evading ||
      this.holding ||
      tank.frozenTimeout > 0 ||
      this.goal == null
    ) {
      this.stall = 0
      return
    }
    this.stall += delta
    if (this.stall >= STALL_LIMIT) {
      // 道具、射击位往往相邻好几个 spot 都算，只禁一个会一格一格地试
      for (let dr = -BAN_RADIUS; dr <= BAN_RADIUS; dr += 1) {
        for (let dc = -BAN_RADIUS; dc <= BAN_RADIUS; dc += 1) {
          this.banned.set(this.goal.spot + dr * N + dc, ctx.time + BAN_DURATION)
        }
      }
      this.stall = 0
      this.following = false
      this.replanTimer = 0
    }
  }

  /** 挡路的坦克占着的 spot 暂时不走；不是坦克挡路时（砖、钢的边角）就是正前方那一格 */
  private avoidAhead(tank: Tank, ctx: AIContext): void {
    const { axis, delta } = getDirectionInfo(tank.direction)
    const front = tank.rect()
    if (delta > 0) front[axis] += BLOCK_SIZE
    else front[axis] -= 1
    if (axis === 'x') front.width = 1
    else front.height = 1
    const blockers = ctx.tanks
      .filter((t) => t !== tank && t.alive && testCollide(t.rect(), front, -0.01))
      .map((t) => t.rect())
    const rects = blockers.length > 0 ? blockers : [front]
    for (let t = 0; t < N * N; t += 1) {
      if (rects.some((rect) => testCollide(rect, tankRectAt(t), -0.01))) {
        this.avoided.set(t, ctx.time + AVOID_DURATION)
      }
    }
  }

  private plan(tank: Tank, ctx: AIContext): void {
    const start = startSpot(ctx.map, tank)
    const goal = start == null ? null : this.chooseGoal(tank, ctx, start)
    if (start == null || goal == null) {
      this.goal = null
      this.following = false
      this.arrived = true
      return
    }
    if (this.goal?.spot === goal.spot && this.following) {
      // 目标没变就接着走，重新开始会多一个原地转向的 tick
      this.goal = goal
      return
    }
    this.goal = goal
    const path =
      goal.route == null
        ? digPath(goal.graph, goal.spot)
        : [...(digPath(goal.graph, goal.route[0]) ?? []), ...goal.route.slice(1)]
    this.following = goal.spot !== start && this.follower.begin(tank, path)
    if (this.following && this.follower.done) {
      this.following = false
    }
    this.arrived = !this.following
  }

  private chooseGoal(tank: Tank, ctx: AIContext, start: number): Goal | null {
    const avoid = (t: number) => (this.avoided.get(t) ?? -Infinity) > ctx.time
    const exposure = exposureCosts(ctx)
    const dig = digDistances(ctx.map, start, { avoid, extraCost: (t) => exposure[t] })
    const side = this.side(tank, ctx)
    const open = (goal: Goal | null): goal is Goal =>
      goal != null && (this.banned.get(goal.spot) ?? -Infinity) <= ctx.time

    let goals = [
      ...this.shootingGoals(tank, ctx, start, dig, side),
      ...this.powerUpGoals(tank, ctx, dig),
      ...(side === 0 ? this.defenseGoals(ctx, dig, start) : []),
    ].filter(open)
    if (goals.length === 0) {
      goals = this.guardGoals(ctx, dig, side).filter(open)
    }
    return goals.reduce<Goal | null>(
      (best, g) => (best == null || g.cost < best.cost ? g : best),
      null,
    )
  }

  private shootingGoals(
    tank: Tank,
    ctx: AIContext,
    start: number,
    graph: DigGraph,
    side: number,
  ): Goal[] {
    const bots = ctx.tanks.filter((t) => t.side === 'bot' && t.alive)
    const others = ctx.tanks.filter((t) => t !== tank && t.alive)
    const reach = eagleReachSteps(ctx)
    const dangerous = (bot: Tank) => eagleReachTime(bot, reach) <= EAGLE_THREAT_TIME
    this.eagleThreatened = bots.some(dangerous)
    const goals: Goal[] = []
    for (let t = 0; t < N * N && bots.length > 0; t += 1) {
      if (graph.dist[t] === Infinity) continue
      const pos = spotToTankPos(t)
      // 和别的坦克重叠的格子站不上去；自己脚下这格除外（bot 出生时可能叠在玩家身上）
      const occupied = others.some((other) => testCollide(other.rect(), tankRectAt(t), -0.01))
      if (occupied && t !== start) continue
      for (const bot of bots) {
        const rel = new RelativePosition(pos, bot)
        for (const face of DIRECTIONS) {
          const { length, offset } = rel.getForwardInfo(face)
          if (length <= 0 || offset > ALIGN_TOLERANCE) continue
          const { hit, bricks } = scanLane(ctx.map, ctx.tanks, tank, pos, face)
          if (hit.kind !== 'bot' || (bricks > 0 && hit.distance > MAX_FIRE_THROUGH_BRICK)) {
            continue
          }
          const bonus = dangerous(bot) ? DANGER_BONUS : 0
          const cost = graph.dist[t] + sidePenalty(pos, side) + bricks * BRICK_LAYER_COST - bonus
          goals.push({ spot: t, face, cost, graph })
        }
      }
    }
    return goals
  }

  private powerUpGoals(tank: Tank, ctx: AIContext, graph: DigGraph): Goal[] {
    const powerUps = ctx.powerUps.filter((p) => !p.dead)
    if (powerUps.length === 0) {
      return []
    }
    const humanPlaying = ctx.players.some((p, i) => p != null && ctx.pilots[i] === 'human')
    const mate = ctx.players.find((p) => p != null && p !== tank && p.alive)
    const mateStart = humanPlaying || mate == null ? null : startSpot(ctx.map, mate)
    const mateGraph = mateStart == null ? null : digDistances(ctx.map, mateStart)
    const goals: Goal[] = []
    for (const powerUp of powerUps) {
      const spots = spotsOn(powerUp)
      let bonus = humanPlaying ? POWER_UP_BONUS.withHuman : POWER_UP_BONUS.eager
      if (mateGraph != null) {
        const mine = nearest(graph, spots)
        const theirs = nearest(mateGraph, spots)
        const nearer = mine < theirs || (mine === theirs && ctx.players.indexOf(tank) === 0)
        // 两个托管时只有近的那个去拿，不然两个会一起跑过去抢
        if (!nearer) continue
      }
      for (const t of spots) {
        if (graph.dist[t] === Infinity) continue
        goals.push({ spot: t, face: null, cost: graph.dist[t] - bonus, graph })
      }
    }
    return goals
  }

  /** 每条开路路线从近的一端打到另一端；已经在路线上时朝还有砖的那头接着打 */
  private defenseGoals(ctx: AIContext, graph: DigGraph, start: number): Goal[] {
    const goals: Goal[] = []
    for (const route of defenseRoutes(ctx.map)) {
      const k = route.indexOf(start)
      let ordered: number[]
      if (k !== -1) {
        const bricksAfter = route.slice(k + 1).some((t) => hasBricks(ctx.map, t))
        ordered = bricksAfter ? route.slice(k) : route.slice(0, k + 1).reverse()
      } else {
        const fromHead = graph.dist[route[0]] <= graph.dist[route[route.length - 1]]
        ordered = fromHead ? route : [...route].reverse()
      }
      const cost = graph.dist[ordered[0]] - OPEN_DEFENSE_BONUS
      if (cost === Infinity || ordered.length < 2) continue
      goals.push({ spot: ordered[ordered.length - 1], face: null, cost, graph, route: ordered })
    }
    return goals
  }

  /** 回老鹰旁边守着。双人时各守一侧，单人守在正上方 */
  private guardGoals(ctx: AIContext, graph: DigGraph, side: number): Goal[] {
    const eagle = ctx.map.eagle
    if (eagle == null) {
      return []
    }
    const target: Point =
      side === 0
        ? { x: eagle.x, y: eagle.y - 1.5 * BLOCK_SIZE }
        : { x: eagle.x + side * 1.5 * BLOCK_SIZE, y: eagle.y }
    const goals: Goal[] = []
    for (let t = 0; t < N * N; t += 1) {
      if (graph.dist[t] === Infinity) continue
      const pos = spotToTankPos(t)
      const offset = (Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y)) / 8
      goals.push({ spot: t, face: 'up', cost: graph.dist[t] + offset * GUARD_OFFSET_COST, graph })
    }
    return goals
  }

  /** 双人且两人都在场时 P1 管左半场（-1）、P2 管右半场（1）；否则整个场地都管（0） */
  private side(tank: Tank, ctx: AIContext): number {
    if (ctx.players.filter((p) => p != null).length < 2) {
      return 0
    }
    return ctx.players.indexOf(tank) === 0 ? -1 : 1
  }
}
