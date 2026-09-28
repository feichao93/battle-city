import { BULLET_SIZE } from '../constants'
import type Bullet from '../entities/Bullet'
import type TerrainMap from '../map/TerrainMap'
import { getDirectionInfo, type Rect } from '../physics/geometry'
import type { AIContext } from './controller'

const EPS = 0.01

/** 子弹沿自己的方向从 from 飞到 to 这一段有砖或钢挡着 */
function shielded(map: TerrainMap, bullet: Bullet, from: number, to: number): boolean {
  const between: Rect =
    getDirectionInfo(bullet.direction).axis === 'x'
      ? { x: from, y: bullet.y, width: to - from, height: BULLET_SIZE }
      : { x: bullet.x, y: from, width: BULLET_SIZE, height: to - from }
  return map.collideBrick(between, -EPS) || map.collideSteel(between, -EPS)
}

/** horizon 毫秒以内会打中 rect 的 bot 子弹，按到达时间排序；bot 子弹穿过 bot，只看地形挡没挡 */
export function incomingBullets(
  rect: Rect,
  ctx: AIContext,
  horizon: number,
): { bullet: Bullet; time: number }[] {
  const result: { bullet: Bullet; time: number }[] = []
  for (const bullet of ctx.bullets) {
    if (bullet.dead || bullet.side !== 'bot') continue
    const { axis, delta } = getDirectionInfo(bullet.direction)
    const cross = axis === 'x' ? 'y' : 'x'
    const size = axis === 'x' ? rect.height : rect.width
    if (bullet[cross] + BULLET_SIZE <= rect[cross] || bullet[cross] >= rect[cross] + size) {
      continue
    }
    const length = axis === 'x' ? rect.width : rect.height
    const [lo, hi] =
      delta > 0 ? [bullet[axis] + BULLET_SIZE, rect[axis]] : [rect[axis] + length, bullet[axis]]
    const time = (hi - lo) / bullet.speed
    if (hi < lo || time > horizon) continue
    if (shielded(ctx.map, bullet, lo, hi)) continue
    result.push({ bullet, time })
  }
  return result.sort((a, b) => a.time - b.time)
}
