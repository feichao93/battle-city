import { BLOCK_SIZE, BULLET_SIZE, FIELD_SIZE, TANK_SIZE } from '../constants'
import type Bullet from '../entities/Bullet'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import {
  ceil8,
  floor8,
  getDirectionInfo,
  isPerpendicular,
  round8,
  testCollide,
  type Rect,
} from '../physics/geometry'
import type { Direction, Input, Point } from '../types'
import { bulletLimit, moveSpeed } from '../values'
import type { AIContext } from './controller'
import { BULLET_OFFSET, openLane } from './lane'
import { N, spotToTankPos } from './spots'

/** 来弹这么久以内会打中才处理 */
const THREAT_HORIZON = 600
/** bot 只朝这么远以内的玩家开火（env.ts FireThreshold.playerTank） */
const AIM_RANGE = 6 * BLOCK_SIZE
/**
 * 多血的 bot 在这么近处正对着自己时对射必输：自己打中一发还在冷却，它回的子弹就到了。
 * 1 血的 bot 不用让，一发就能打掉
 */
const DUEL_RANGE = 3 * BLOCK_SIZE
/** 横穿这么近的 bot 射线时，走过去（约 420ms）之前它的子弹就到了 */
const CROSS_RANGE = 3 * BLOCK_SIZE
/** 站在 bot 射线里每格的代价，乘以 bot 剩余血量 */
const EXPOSURE_COST = 1
const EPS = 0.01

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/** 子弹沿自己的方向从 from 飞到 to 这一段有砖或钢挡着 */
function shielded(map: TerrainMap, bullet: Bullet, from: number, to: number): boolean {
  const between: Rect =
    getDirectionInfo(bullet.direction).axis === 'x'
      ? { x: from, y: bullet.y, width: to - from, height: BULLET_SIZE }
      : { x: bullet.x, y: from, width: BULLET_SIZE, height: to - from }
  return map.collideBrick(between, -EPS) || map.collideSteel(between, -EPS)
}

/** 最先打中坦克的 bot 子弹 */
export function incomingBullet(tank: Tank, ctx: AIContext): Bullet | null {
  let first: Bullet | null = null
  let firstTime = Infinity
  for (const bullet of ctx.bullets) {
    if (bullet.dead || bullet.side !== 'bot') continue
    const { axis, delta } = getDirectionInfo(bullet.direction)
    const cross = axis === 'x' ? 'y' : 'x'
    if (bullet[cross] + BULLET_SIZE <= tank[cross] || bullet[cross] >= tank[cross] + TANK_SIZE) {
      continue
    }
    const [lo, hi] =
      delta > 0 ? [bullet[axis] + BULLET_SIZE, tank[axis]] : [tank[axis] + TANK_SIZE, bullet[axis]]
    const time = (hi - lo) / bullet.speed
    if (hi < lo || time > THREAT_HORIZON || time >= firstTime) continue
    if (shielded(ctx.map, bullet, lo, hi)) continue
    first = bullet
    firstTime = time
  }
  return first
}

/**
 * 来弹和炮口对得上、又能马上开火时，转过去开火抵消它，返回这一 tick 的移动；对不上返回 null。
 * 侧移躲子弹在对局里是负收益（躲开后常又走回通道），所以只对射
 */
export function counterFire(
  tank: Tank,
  ctx: AIContext,
  bullet: Bullet,
): { move: Input | null } | null {
  const cross = getDirectionInfo(bullet.direction).axis === 'x' ? 'y' : 'x'
  const face = OPPOSITE[bullet.direction]
  // 转 90° 时驱动层会把坐标吸附到 8px 格点
  const after: Point = isPerpendicular(face, tank.direction) ? { x: tank.rx, y: tank.ry } : tank
  const own = ctx.bullets.filter((b) => b.tankId === tank.tankId && !b.dead).length
  const ready = tank.cooldown <= 0 && own < bulletLimit(tank)
  if (!ready || Math.abs(bullet[cross] - (after[cross] + BULLET_OFFSET)) >= BULLET_SIZE) {
    return null
  }
  return { move: tank.direction === face ? null : { type: 'turn', direction: face } }
}

/** 坦克沿当前朝向前进时，会不会正好在 bot 子弹经过的时候走进它的通道 */
export function stepsIntoBullet(tank: Tank, ctx: AIContext): boolean {
  const { axis: moveAxis, delta: sign } = getDirectionInfo(tank.direction)
  const speed = moveSpeed(tank)
  for (const bullet of ctx.bullets) {
    if (bullet.dead || bullet.side !== 'bot') continue
    const { axis, delta } = getDirectionInfo(bullet.direction)
    if (axis === moveAxis) continue
    // 子弹扫过坦克所在那一段的时间窗
    const gap =
      delta > 0
        ? tank[axis] - (bullet[axis] + BULLET_SIZE)
        : bullet[axis] - (tank[axis] + TANK_SIZE)
    const leave = (gap + TANK_SIZE + BULLET_SIZE) / bullet.speed
    const arrive = Math.max(0, gap / bullet.speed)
    if (leave < 0 || arrive > THREAT_HORIZON) continue
    // 坦克走进、走出子弹通道的时间窗；已经在通道里的不算，那是 incomingBullet 的事
    const lane = bullet[moveAxis]
    const c = tank[moveAxis]
    const enter = (sign > 0 ? lane - TANK_SIZE - c : c - lane - BULLET_SIZE) / speed
    const exit = (sign > 0 ? lane + BULLET_SIZE - c : c + TANK_SIZE - lane) / speed
    if (enter <= 0 || exit <= 0 || enter >= leave || arrive >= exit) continue
    const [lo, hi] = delta > 0 ? [bullet[axis], tank[axis] + TANK_SIZE] : [tank[axis], bullet[axis]]
    if (shielded(ctx.map, bullet, lo, hi)) continue
    return true
  }
  return false
}

/** 每个 spot 暴露在 bot 炮口射线里的代价，按 bot 剩余血量算：armor 要挨 4 发，最不该站到它前面 */
export function exposureCosts(ctx: AIContext): Float64Array {
  const costs = new Float64Array(N * N)
  for (const bot of ctx.tanks) {
    const lane = bot.side === 'bot' ? aimLane(ctx, bot, AIM_RANGE) : null
    if (lane == null) continue
    for (let t = 0; t < N * N; t += 1) {
      if (testCollide(lane, tankRectAt(spotToTankPos(t)), -EPS)) costs[t] += EXPOSURE_COST * bot.hp
    }
  }
  return costs
}

/** bot 炮口前方 range 以内、到第一块砖或钢为止的射线；冻结的 bot 不开火 */
function aimLane(ctx: AIContext, bot: Tank, range: number): Rect | null {
  if (!bot.alive || bot.frozenTimeout > 0) return null
  return openLane(ctx.map, bot, bot.direction, range)
}

/**
 * 被 bot 正对着时的站位调整，不用调整时返回 undefined：
 * - 多血的 bot 离得太近：横移出它的射线
 * - 炮口错开到对射抵消不了（双方都打得到对方）：横移到和它对齐
 */
export function avoidAim(tank: Tank, ctx: AIContext): Input | null | undefined {
  const bots = ctx.tanks.filter((t) => t.side === 'bot')
  const covers = (lane: Rect | null) => lane != null && testCollide(lane, tank.rect(), -EPS)
  const close = bots.find((bot) => bot.hp > 1 && covers(aimLane(ctx, bot, DUEL_RANGE)))
  const out = close == null ? undefined : sidestep(tank, ctx, close, 'out')
  if (out !== undefined) return out
  const cross = (bot: Tank) => (getDirectionInfo(bot.direction).axis === 'x' ? 'y' : 'x')
  const misaligned = bots.find(
    (bot) =>
      covers(aimLane(ctx, bot, AIM_RANGE)) &&
      Math.abs(bot[cross(bot)] - tank[cross(bot)]) >= BULLET_SIZE,
  )
  return misaligned == null ? undefined : sidestep(tank, ctx, misaligned, 'align')
}

function tankRectAt(pos: Point): Rect {
  return { x: pos.x, y: pos.y, width: TANK_SIZE, height: TANK_SIZE }
}

/** 坦克从 pos 沿 cross 轴平移 amount 一路上没有东西挡着 */
function canShift(tank: Tank, ctx: AIContext, pos: Point, cross: 'x' | 'y', amount: number) {
  const swept = tankRectAt(pos)
  swept[cross === 'x' ? 'width' : 'height'] += Math.abs(amount)
  if (amount < 0) swept[cross] += amount
  if (
    swept.x < 0 ||
    swept.y < 0 ||
    swept.x + swept.width > FIELD_SIZE ||
    swept.y + swept.height > FIELD_SIZE
  ) {
    return false
  }
  const { map } = ctx
  if (
    map.collideBrick(swept, -EPS) ||
    map.collideSteel(swept, -EPS) ||
    map.collideRiver(swept, -EPS) ||
    (map.eagle != null && testCollide(tankRectAt(map.eagle), swept, -EPS))
  ) {
    return false
  }
  return !ctx.tanks.some((t) => t !== tank && t.alive && testCollide(t.rect(), swept, -EPS))
}

/** 横移到和 bot 炮口对齐（align），或整辆坦克移出它的子弹通道（out）；两边都走不通时 undefined */
function sidestep(
  tank: Tank,
  ctx: AIContext,
  bot: Tank,
  mode: 'align' | 'out',
): Input | null | undefined {
  const cross: 'x' | 'y' = getDirectionInfo(bot.direction).axis === 'x' ? 'y' : 'x'
  let best: { direction: Direction; shift: number; cost: number } | null = null
  for (const direction of DIRECTIONS) {
    const { axis, delta: sign } = getDirectionInfo(direction)
    if (axis !== cross) continue
    // 转 90° 时驱动层会把坐标吸附到 8px 格点
    const pos: Point = isPerpendicular(direction, tank.direction)
      ? { x: tank.rx, y: tank.ry }
      : tank
    // out 停在格点上：停在格点之间，下次垂直转向的吸附可能又把坦克带回射线里
    const shift =
      mode === 'align'
        ? (bot[cross] - pos[cross]) * sign
        : sign > 0
          ? ceil8(bot[cross] + BULLET_OFFSET + BULLET_SIZE) - pos[cross]
          : pos[cross] - floor8(bot[cross] + BULLET_OFFSET - TANK_SIZE)
    if (shift < 0 || (mode === 'out' && shift === 0)) continue
    const cost = shift + (direction === tank.direction ? 0 : 1)
    if (best != null && cost >= best.cost) continue
    if (shift > 0 && !canShift(tank, ctx, pos, cross, sign * shift)) continue
    best = { direction, shift, cost }
  }
  if (best == null) return undefined
  if (tank.direction !== best.direction) return { type: 'turn', direction: best.direction }
  return best.shift > 0 ? { type: 'forward', maxDistance: best.shift } : null
}

/** bot 这一刻能开火：冷却好了、上一发子弹也没在飞 */
function canFire(bot: Tank, ctx: AIContext): boolean {
  return bot.cooldown <= 0 && !ctx.bullets.some((b) => b.tankId === bot.tankId && !b.dead)
}

/**
 * 沿 direction 走到下一个 8px 格点（要转 90° 时按吸附后的位置算）会进入某辆能开火的 bot 的近处射线时，
 * 返回停在格点上等的动作：在格点上就原地等，在两个格点之间就挪到不在射线里的那个；不用等时 undefined。
 * 停在格点之间会多伸出几 px，挡住 bot 那一行的路。bot 的子弹正在飞时它开不了火，这时横穿过去是安全的
 */
export function holdBeforeAim(
  tank: Tank,
  ctx: AIContext,
  direction: Direction,
): Input | null | undefined {
  const now = tank.rect()
  const lanes: Rect[] = []
  for (const bot of ctx.tanks) {
    if (bot.side !== 'bot' || !canFire(bot, ctx)) continue
    const lane = aimLane(ctx, bot, CROSS_RANGE)
    if (lane != null && !testCollide(lane, now, -EPS)) lanes.push(lane)
  }
  const inLane = (rect: Rect) => lanes.some((lane) => testCollide(lane, rect, -EPS))
  const from: Point = isPerpendicular(direction, tank.direction) ? { x: tank.rx, y: tank.ry } : tank
  const { axis, delta: sign } = getDirectionInfo(direction)
  const next = sign > 0 ? floor8(from[axis]) + 8 : ceil8(from[axis]) - 8
  const swept = tankRectAt(from)
  swept[axis === 'x' ? 'width' : 'height'] += Math.abs(next - from[axis])
  if (sign < 0) swept[axis] = next
  if (!inLane(swept)) return undefined

  const { axis: own, delta: facing } = getDirectionInfo(tank.direction)
  const coord = tank[own]
  if (Math.abs(coord - round8(coord)) < EPS) return null
  // 先试朝向前方的格点，不用掉头
  const targets = facing > 0 ? [ceil8(coord), floor8(coord)] : [floor8(coord), ceil8(coord)]
  for (const target of targets) {
    const pos: Point = { x: tank.x, y: tank.y, [own]: target }
    if (inLane(tankRectAt(pos)) || !canShift(tank, ctx, tank, own, target - coord)) continue
    return target === targets[0]
      ? { type: 'forward', maxDistance: Math.abs(target - coord) }
      : { type: 'turn', direction: OPPOSITE[tank.direction] }
  }
  return null
}
