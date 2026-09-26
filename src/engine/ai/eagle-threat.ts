import type Tank from '../entities/Tank'
import type { Direction } from '../types'
import { moveSpeed } from '../values'
import type { AIContext } from './controller'
import { RelativePosition } from './env'
import { scanLane } from './lane'
import { dirs, getTankSpot, N, spotToTankPos } from './spots'

/** 打到老鹰之前最多要打穿几层砖，再多 bot 基本打不动 */
const MAX_BRICKS = 3
/** 子弹（炮口偏 6px、宽 3px）和 16px 的老鹰重叠的最大横向偏差 */
const HIT_OFFSET = 9

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

/** 站在这些 spot 上朝某个方向开火能打到老鹰 */
export function eagleFireSpots(ctx: AIContext): number[] {
  const eagle = ctx.map.eagle
  if (eagle == null || ctx.map.eagleBroken) return []
  const result: number[] = []
  for (let t = 0; t < N * N; t += 1) {
    if (!ctx.spots[t]?.canPass) continue
    const pos = spotToTankPos(t)
    const rel = new RelativePosition(pos, eagle)
    const aims = DIRECTIONS.some((direction) => {
      const { length, offset } = rel.getForwardInfo(direction)
      if (length <= 0 || offset > HIT_OFFSET) return false
      const { hit, bricks } = scanLane(ctx.map, [], null, pos, direction)
      return hit.kind === 'eagle' && bricks <= MAX_BRICKS
    })
    if (aims) result.push(t)
  }
  return result
}

/** 每个 spot 走到最近的开火位要几步（每步 8px） */
export function eagleReachSteps(ctx: AIContext): Int32Array {
  const dist = new Int32Array(N * N).fill(-1)
  let frontier = eagleFireSpots(ctx)
  for (const t of frontier) dist[t] = 0
  let step = 0
  while (frontier.length > 0) {
    step += 1
    const next: number[] = []
    for (const u of frontier) {
      for (const dir of dirs) {
        const v = dir(u)
        if (v == null || dist[v] !== -1 || !ctx.spots[v]?.canPass) continue
        dist[v] = step
        next.push(v)
      }
    }
    frontier = next
  }
  return dist
}

/** bot 还要多久（ms）能走到可以打老鹰的位置；走不到为 Infinity */
export function eagleReachTime(bot: Tank, steps: Int32Array): number {
  const d = steps[getTankSpot(bot)]
  return d < 0 ? Infinity : (d * 8) / moveSpeed(bot)
}
