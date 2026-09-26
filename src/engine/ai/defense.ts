import { BLOCK_SIZE, FIELD_SIZE } from '../constants'
import type TerrainMap from '../map/TerrainMap'
import type { Point } from '../types'
import { digDistances, diggable, digPath, hasBricks } from './dig-path'
import { N } from './spots'

/** 打砖开路比绕现成的路少走这么多格，才算这些砖妨碍防守 */
const MIN_SAVING = 12
/** 开出来的路本身也得够近，绕半张图的路打通了也赶不及 */
const MAX_ROUTE_COST = 24

function toSpot(pos: Point): number | null {
  if (
    pos.x < 0 ||
    pos.y < 0 ||
    pos.x > FIELD_SIZE - BLOCK_SIZE ||
    pos.y > FIELD_SIZE - BLOCK_SIZE
  ) {
    return null
  }
  return ((pos.y + 8) / 8) * N + (pos.x + 8) / 8
}

/**
 * 老鹰上下左右的拦截位：bot 从这个方向打老鹰时，守在这里正好挡在它和老鹰之间。
 * 贴着外墙外侧，在还能挡住子弹的范围内可以挪 8px：优先没压着砖的位置，都压到钢、河或出界就不守这个方向
 */
export function interceptSpots(map: TerrainMap): number[] {
  const eagle = map.eagle
  if (eagle == null) {
    return []
  }
  // 老鹰 16px 加外墙 8px
  const gap = 1.5 * BLOCK_SIZE
  const shifts = [0, -8, 8]
  const sides: Point[][] = [
    shifts.map((d) => ({ x: eagle.x + d, y: eagle.y - gap })),
    shifts.map((d) => ({ x: eagle.x + d, y: eagle.y + gap })),
    shifts.map((d) => ({ x: eagle.x - gap, y: eagle.y + d })),
    shifts.map((d) => ({ x: eagle.x + gap, y: eagle.y + d })),
  ]
  const spots: number[] = []
  for (const positions of sides) {
    const valid = positions.map(toSpot).filter((t): t is number => t != null && diggable(map, t))
    const spot = valid.find((t) => !hasBricks(map, t)) ?? valid[0]
    if (spot != null) spots.push(spot)
  }
  return spots
}

const cache = new WeakMap<TerrainMap, { version: number; routes: number[][] }>()

/**
 * 妨碍防守的砖：两个拦截位之间只走现成的路太绕（或者走不通），打砖开一条不长的路能少走 MIN_SAVING 格以上。
 * bot 从一个方向打老鹰时，守在另一侧的坦克赶不过去。返回这些开路路线，地形不变时直接用缓存
 */
export function defenseRoutes(map: TerrainMap): number[][] {
  const cached = cache.get(map)
  if (cached?.version === map.version) {
    return cached.routes
  }
  const spots = interceptSpots(map)
  const routes: number[][] = []
  spots.forEach((a, i) => {
    const dig = digDistances(map, a)
    const walk = hasBricks(map, a) ? null : digDistances(map, a, { layerCost: Infinity })
    for (const b of spots.slice(i + 1)) {
      const walkDist = walk == null || hasBricks(map, b) ? Infinity : walk.dist[b]
      if (dig.dist[b] <= MAX_ROUTE_COST && walkDist - dig.dist[b] >= MIN_SAVING) {
        routes.push(digPath(dig, b)!)
      }
    }
  })
  cache.set(map, { version: map.version, routes })
  return routes
}
