import { BLOCK_SIZE, BULLET_SIZE, ITEM_SIZE_MAP, TANK_SIZE } from '../constants'
import type Tank from '../entities/Tank'
import {
  getDirectionInfo,
  isInField,
  isPerpendicular,
  testCollide,
  type Rect,
} from '../physics/geometry'
import { bulletSnapshot, powerUpSnapshot, tankSnapshot, terrainSnapshot } from '../snapshot'
import { drawField } from '../textView'
import type { Direction, Point, TankLevel } from '../types'
import type { AIContext } from './controller'
import {
  hotRay,
  REACTION_MS,
  type Action,
  type Blocker,
  type DecisionState,
  type RawState,
} from './decision'
import { BULLET_OFFSET, scanLane } from './lane'
import { incomingBullets } from './self-defense'
import { bulletLimit, bulletSpeed, moveSpeed } from '../values'

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']
const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}
const STARS: Record<TankLevel, number> = { basic: 0, fast: 1, power: 2, armor: 3 }
/** 最多告诉模型这么多辆 bot，按距离取近的 */
const MAX_BOTS = 6
/** exposure 按走一步的距离算：一个决策周期（约 150ms）开 6–7px */
const STEP_PX = 8
const STEP: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
/** 这么久以内会打到的子弹才告诉模型 */
const BULLET_HORIZON = 1500
/** 打砖最多估到这么多层（4px 一层） */
const MAX_DIG_LAYERS = 16
/** moves 往前探这么远判断能不能走 */
const PROBE = 4
const EPS = 0.01

const cells = (px: number): number => Math.round(px / 8)
const oneDecimal = (v: number): number => Math.round(v * 10) / 10

/** 转向后坦克的位置：转 90° 时驱动层会把坐标吸附到 8px 格点 */
function turnedPos(tank: Tank, direction: Direction): Point {
  return isPerpendicular(direction, tank.direction) ? { x: tank.rx, y: tank.ry } : tank
}

function probeRect(pos: Point, direction: Direction): Rect {
  const rect = { x: pos.x, y: pos.y, width: BLOCK_SIZE, height: BLOCK_SIZE }
  if (direction === 'up') rect.y -= PROBE
  if (direction === 'down') rect.y += PROBE
  if (direction === 'left') rect.x -= PROBE
  if (direction === 'right') rect.x += PROBE
  return rect
}

/** 朝 direction 往前走一小步会被什么挡住 */
function blockerAt(tank: Tank, ctx: AIContext, direction: Direction): Blocker {
  return blockerFrom(turnedPos(tank, direction), ctx, direction, tank)
}

/** 坦克 tank 站在 pos 朝 direction 往前走一小步会被什么挡住 */
function blockerFrom(pos: Point, ctx: AIContext, direction: Direction, tank: Tank): Blocker {
  const rect = probeRect(pos, direction)
  const { map } = ctx
  if (!isInField(rect)) return 'edge'
  if (map.eagle != null) {
    const eagle = { x: map.eagle.x, y: map.eagle.y, width: BLOCK_SIZE, height: BLOCK_SIZE }
    if (testCollide(eagle, rect, -EPS)) return 'eagle'
  }
  if (map.collideSteel(rect, -EPS)) return 'steel'
  if (map.collideRiver(rect, -EPS)) return 'river'
  if (map.collideBrick(rect, -EPS)) return 'brick'
  const tanks = ctx.tanks.filter((t) => t !== tank && t.alive)
  if (tanks.some((t) => testCollide(t.rect(), rect, -EPS))) return 'tank'
  return 'free'
}

/** 往 d 走一步（STEP_PX）后的位置 */
function ahead(pos: Point, d: Direction): Point {
  const [sx, sy] = STEP[d]
  return { x: pos.x + sx * STEP_PX, y: pos.y + sy * STEP_PX }
}

/** 转 90° 时驱动层会把坐标吸附到 8px 格点 */
function snap(pos: Point): Point {
  return { x: Math.round(pos.x / 8) * 8, y: Math.round(pos.y / 8) * 8 }
}

/** 算射线时只用到 side / alive / rect()，不 new Tank，免得占用引擎的 tankId */
function standIn(pos: Point): Tank {
  return {
    side: 'player',
    alive: true,
    rect: () => ({ x: pos.x, y: pos.y, width: TANK_SIZE, height: TANK_SIZE }),
  } as unknown as Tank
}

/** shooter 站在 from 朝 d 开火、第一个打中的就是 target 时，返回中间要打穿的砖和距离；打不到为 null */
function hits(
  ctx: AIContext,
  tanks: Tank[],
  shooter: Tank,
  from: Point,
  d: Direction,
  target: Tank,
): { bricks: number; distance: number } | null {
  const { hit, bricks } = scanLane(ctx.map, tanks, shooter, from, d)
  const only = scanLane(ctx.map, [target], shooter, from, d).hit
  const kind = target.side === 'bot' ? 'bot' : 'player'
  return hit.kind === kind && only.kind === kind && Math.abs(only.distance - hit.distance) < 1
    ? { bricks, distance: hit.distance }
    : null
}

/** 从 from 看 to 所在的两个方向（横、竖各一个） */
function toward(from: Point, to: Point): Direction[] {
  return [to.x < from.x ? 'left' : 'right', to.y < from.y ? 'up' : 'down']
}

/** bot 朝哪个方向开火能打到 me；bot 子弹穿过 bot，所以 tanks 只放玩家（me 可以是替身） */
function threatOf(ctx: AIContext, players: Tank[], bot: Tank, me: Tank) {
  for (const d of toward(bot, me.rect())) {
    const hit = hits(ctx, players, bot, bot, d, me)
    if (hit != null) {
      const eta = Math.round(hit.distance / bulletSpeed(bot))
      return { direction: d, facing: d === bot.direction, bricks: hit.bricks, eta }
    }
  }
  return null
}

/** 坦克正前方 [from, to] 这一段、和坦克一样宽的带子 */
function bandAhead(pos: Point, d: Direction, from: number, to: number): Rect {
  switch (d) {
    case 'up':
      return { x: pos.x, y: pos.y - to, width: TANK_SIZE, height: to - from }
    case 'down':
      return { x: pos.x, y: pos.y + TANK_SIZE + from, width: TANK_SIZE, height: to - from }
    case 'left':
      return { x: pos.x - to, y: pos.y, width: to - from, height: TANK_SIZE }
    case 'right':
      return { x: pos.x + TANK_SIZE + from, y: pos.y, width: to - from, height: TANK_SIZE }
  }
}

/** 一枪大约打掉一层 4px 的砖，连续有砖的层数就是开过去要打的枪数 */
function digShots(tank: Tank, ctx: AIContext, d: Direction): number {
  const layer = ITEM_SIZE_MAP.BRICK / 2
  const pos = turnedPos(tank, d)
  let shots = 0
  while (shots < MAX_DIG_LAYERS) {
    const band = bandAhead(pos, d, shots * layer, (shots + 1) * layer)
    if (!isInField(band) || !ctx.map.collideBrick(band, -EPS)) break
    shots += 1
  }
  return shots
}

/** 来弹的躲避和对射估算，见 DecisionState.incoming */
function incomingOf(tank: Tank, ctx: AIContext, moves: DecisionState['moves']) {
  const mine = ctx.bullets.filter((b) => b.tankId === tank.tankId && !b.dead).length
  const canFire = mine < bulletLimit(tank) && tank.cooldown <= REACTION_MS
  return incomingBullets(tank.rect(), ctx, BULLET_HORIZON).map(({ bullet, time }) => {
    const cross = getDirectionInfo(bullet.direction).axis === 'x' ? 'y' : 'x'
    const dodge = DIRECTIONS.filter(
      (d) => isPerpendicular(d, bullet.direction) && moves[d] === 'free',
    ).map((d) => {
      const at = turnedPos(tank, d)[cross]
      const negative = d === 'up' || d === 'left'
      const px = negative ? at + TANK_SIZE - bullet[cross] : bullet[cross] + BULLET_SIZE - at
      const ms = Math.round(Math.max(0, px) / moveSpeed(tank))
      return { direction: d, ms, inTime: REACTION_MS + ms < time }
    })
    // 迎面开火：两颗子弹的横向位置重叠才会对撞
    const from = OPPOSITE[bullet.direction]
    const muzzle = turnedPos(tank, from)[cross] + BULLET_OFFSET
    const overlap = muzzle < bullet[cross] + BULLET_SIZE && muzzle + BULLET_SIZE > bullet[cross]
    return {
      from,
      eta: Math.round(time),
      dodge,
      counter: canFire && overlap && REACTION_MS < time,
    }
  })
}

/** 给决策模型的 state，见 DecisionState */
export function observe(tank: Tank, ctx: AIContext, recentActions: Action[]): DecisionState {
  const { map } = ctx
  const rel = (p: Point) => ({ dx: cells(p.x - tank.x), dy: cells(p.y - tank.y) })

  const field = drawField(
    {
      terrain: terrainSnapshot(map),
      eagle: map.eagle == null ? null : { ...map.eagle, broken: map.eagleBroken },
      slots: ctx.players.map((p) => ({
        tankId: p?.tankId ?? null,
        state: p == null ? 'out' : 'alive',
      })),
      tanks: ctx.tanks.filter((t) => t.alive).map((t) => tankSnapshot(t, null)),
      spawning: [],
      bullets: ctx.bullets.filter((b) => !b.dead).map(bulletSnapshot),
      powerUps: ctx.powerUps.filter((p) => !p.dead).map(powerUpSnapshot),
    },
    tank.tankId,
  )

  const moves = {} as DecisionState['moves']
  const lanes = {} as DecisionState['lanes']
  for (const direction of DIRECTIONS) {
    moves[direction] = blockerAt(tank, ctx, direction)
    const { hit, bricks } = scanLane(map, ctx.tanks, tank, turnedPos(tank, direction), direction)
    lanes[direction] = { hit: hit.kind, distance: oneDecimal(hit.distance / 8), bricks }
  }

  const incoming = incomingOf(tank, ctx, moves)
  const dig = {} as DecisionState['digShots']
  for (const d of DIRECTIONS) dig[d] = moves[d] === 'brick' ? digShots(tank, ctx, d) : 0
  const players = ctx.tanks.filter((t) => t.side === 'player')

  const eagle = map.eagle
  const bots = ctx.tanks
    .filter((t) => t.side === 'bot' && t.alive)
    .map((bot) => ({
      bot,
      far: Math.abs(bot.x - tank.x) + Math.abs(bot.y - tank.y),
    }))
    .sort((a, b) => a.far - b.far)
    .slice(0, MAX_BOTS)
    .map(({ bot }) => bot)
  const botStates = bots.map((bot) => {
    const threat = threatOf(ctx, players, bot, tank)
    const flying = ctx.bullets.some((b) => b.tankId === bot.tankId && !b.dead)
    let shot: DecisionState['bots'][number]['shot'] = null
    for (const d of toward(tank, bot)) {
      const hit = hits(ctx, ctx.tanks, tank, turnedPos(tank, d), d, bot)
      if (hit != null) shot = { direction: d, bricks: hit.bricks }
    }
    return {
      ...rel(bot),
      level: bot.level,
      facing: bot.direction,
      hp: bot.hp,
      readyIn: flying ? null : Math.max(0, Math.round(bot.cooldown)),
      aimingAtMe: threat?.facing === true,
      threat,
      shot,
      aimingAtEagle: scanLane(map, ctx.tanks, bot, bot, bot.direction).hit.kind === 'eagle',
      distToEagle:
        eagle == null ? null : cells(Math.abs(bot.x - eagle.x) + Math.abs(bot.y - eagle.y)),
    }
  })

  // 走一步之后替身站在新位置，逐个 bot 看有没有无遮挡的射线
  // 替身站在 pos，逐个 bot 看有没有无遮挡的射线
  const exposureAt = (pos: Point) => {
    const me = standIn(pos)
    const others = players.filter((t) => t !== tank).concat(me)
    return bots.flatMap((bot, i) => {
      const threat = threatOf(ctx, others, bot, me)
      return threat?.bricks === 0 ? [{ bot: i, facing: threat.facing, eta: threat.eta }] : []
    })
  }
  const safeAt = (pos: Point) =>
    exposureAt(pos).every((e) => !hotRay(botStates[e.bot].readyIn, e.facing, e.eta))

  const exposure = {} as DecisionState['exposure']
  const exits = {} as DecisionState['exits']
  for (const d of DIRECTIONS) {
    exposure[d] = []
    exits[d] = []
    if (moves[d] !== 'free') continue
    const first = ahead(turnedPos(tank, d), d)
    exposure[d] = exposureAt(first)
    // 再看一步：只看一步时模型会一步步走进四面都是射线的死角（v10 阵亡 20/23 死前出现过全是危险选项）
    for (const d2 of DIRECTIONS) {
      const from = isPerpendicular(d2, d) ? snap(first) : first
      if (blockerFrom(from, ctx, d2, tank) === 'free' && safeAt(ahead(from, d2))) exits[d].push(d2)
    }
  }

  const index = ctx.players.indexOf(tank)
  const mate = ctx.players.find((p, i) => i !== index && p != null && p.alive) ?? null

  return {
    map: field,
    me: {
      col: cells(tank.x),
      row: cells(tank.y),
      facing: tank.direction,
      helmet: tank.helmetDuration > 0,
      stars: STARS[tank.level],
      bulletsInFlight: ctx.bullets.filter((b) => b.tankId === tank.tankId && !b.dead).length,
    },
    moves,
    exposure,
    exits,
    lanes,
    incoming,
    digShots: dig,
    bots: botStates,
    eagle: eagle == null ? null : { ...rel(eagle), broken: map.eagleBroken },
    teammate: mate == null ? null : { ...rel(mate), pilot: ctx.pilots[ctx.players.indexOf(mate)] },
    powerUps: ctx.powerUps.filter((p) => !p.dead).map((p) => ({ type: p.name, ...rel(p) })),
    recentActions,
    remainingBots: ctx.remainingBots,
    raw: rawState(tank, ctx, mate),
  }
}

function rawState(tank: Tank, ctx: AIContext, mate: Tank | null): RawState {
  const { map } = ctx
  const at = (p: Point) => ({ col: oneDecimal(p.x / 8), row: oneDecimal(p.y / 8) })
  const eagle = map.eagle == null ? null : { ...map.eagle, broken: map.eagleBroken }
  return {
    terrain: drawField({
      terrain: terrainSnapshot(map),
      eagle,
      slots: [],
      tanks: [],
      spawning: [],
      bullets: [],
      powerUps: [],
    }),
    me: {
      ...at(tank),
      direction: tank.direction,
      level: tank.level,
      helmet: tank.helmetDuration > 0,
    },
    bots: ctx.tanks
      .filter((t) => t.side === 'bot' && t.alive)
      .map((t) => ({ ...at(t), direction: t.direction, level: t.level, hp: t.hp })),
    bullets: ctx.bullets
      .filter((b) => !b.dead)
      .map((b) => ({
        ...at(b),
        direction: b.direction,
        owner: b.tankId === tank.tankId ? 'me' : b.side === 'bot' ? 'bot' : 'teammate',
      })),
    teammate: mate == null ? null : { ...at(mate), direction: mate.direction },
    powerUps: ctx.powerUps.filter((p) => !p.dead).map((p) => ({ type: p.name, ...at(p) })),
    eagle: eagle == null ? null : { ...at(eagle), broken: eagle.broken },
  }
}
