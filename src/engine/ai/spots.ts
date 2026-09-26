import type Bullet from '../entities/Bullet'
import type TerrainMap from '../map/TerrainMap'
import type { Point } from '../types'

/** spot graph 为 26×26（每格 8px），坦克 16×16 居中于某个 spot */
export const N = 26

export const getRow = (t: number): number => Math.floor(t / N)
export const getCol = (t: number): number => t % N

export const left = (t: number): number | null => (getCol(t) === 0 ? null : t - 1)
export const right = (t: number): number | null => (getCol(t) === N - 1 ? null : t + 1)
export const up = (t: number): number | null => (getRow(t) === 0 ? null : t - N)
export const down = (t: number): number | null => (getRow(t) === N - 1 ? null : t + N)

export type DirFn = (t: number) => number | null
export const dirs: DirFn[] = [left, right, up, down]

/** spot 周围 8 邻域（含斜向），过滤越界 */
export function around(t: number): number[] {
  return [
    up(t),
    left(t) != null ? up(left(t)!) : null,
    left(t),
    left(t) != null ? down(left(t)!) : null,
    down(t),
    right(t) != null ? down(right(t)!) : null,
    right(t),
    up(t) != null ? right(up(t)!) : null,
  ].filter((x): x is number => x != null)
}

/** 坦克左上角坐标 → 所在 spot */
export function getTankSpot(point: Point): number {
  const col = Math.round((point.x + 8) / 8)
  const row = Math.round((point.y + 8) / 8)
  return row * N + col
}

/** spot → 坦克应处于的左上角坐标 */
export function spotToTankPos(t: number): Point {
  return { x: getCol(t) * 8 - 8, y: getRow(t) * 8 - 8 }
}

export function getBulletSpot(bullet: Bullet): number {
  const col = Math.floor((bullet.x + 1) / 8)
  const row = Math.round((bullet.y + 1) / 8)
  return row * N + col
}

export interface Spot {
  t: number
  /** 16×16 坦克居中于此是否可通行（不撞砖/钢/河/边界） */
  canPass: boolean
}

const PASS_THRESHOLD = -0.01

/** 构建整张 spot 图的可通行性（随地形变动需重建） */
export function buildSpots(map: TerrainMap): Spot[] {
  const spots: Spot[] = new Array(N * N)
  for (let row = 0; row < N; row += 1) {
    for (let col = 0; col < N; col += 1) {
      const t = row * N + col
      if (row === 0 || col === 0) {
        spots[t] = { t, canPass: false }
        continue
      }
      const rect = { x: col * 8 - 8, y: row * 8 - 8, width: 16, height: 16 }
      const blocked =
        map.collideBrick(rect, PASS_THRESHOLD) ||
        map.collideSteel(rect, PASS_THRESHOLD) ||
        map.collideRiver(rect, PASS_THRESHOLD)
      spots[t] = { t, canPass: !blocked }
    }
  }
  return spots
}
