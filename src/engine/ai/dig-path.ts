import { BLOCK_SIZE, ITEM_SIZE_MAP } from '../constants'
import type TerrainMap from '../map/TerrainMap'
import { testCollide, type Rect } from '../physics/geometry'
import { BULLET_OFFSET, BULLET_WIDTH, eagleGuard } from './lane'
import { dirs, getCol, getRow, N, spotToTankPos } from './spots'

/**
 * 打掉一层砖（4px 深）折算成走几格：玩家子弹一发正好打掉坦克宽度的一层，
 * 开火间隔约 300ms，走一格（8px）约 180ms
 */
export const BRICK_LAYER_COST = 2

const EPS = 0.01

export interface DigGraph {
  /** 从起点出发的代价；到不了为 Infinity */
  dist: Float64Array
  prev: Int32Array
}

function tankRect(t: number): Rect {
  return { ...spotToTankPos(t), width: BLOCK_SIZE, height: BLOCK_SIZE }
}

function shrink(rect: Rect): Rect {
  return {
    x: rect.x + EPS,
    y: rect.y + EPS,
    width: rect.width - 2 * EPS,
    height: rect.height - 2 * EPS,
  }
}

/** 坦克停在这个 spot 上会不会压到打不掉的东西：边界、钢、河、老鹰 */
export function diggable(map: TerrainMap, t: number): boolean {
  if (getRow(t) === 0 || getCol(t) === 0) return false
  const rect = shrink(tankRect(t))
  if (map.steelIndicesIn(rect).length > 0 || map.collideRiver(rect, -EPS)) return false
  if (map.eagle != null) {
    const eagle = { ...map.eagle, width: BLOCK_SIZE, height: BLOCK_SIZE }
    if (testCollide(eagle, rect, -EPS)) return false
  }
  return true
}

/** 坦克停在这个 spot 上会压到砖 */
export function hasBricks(map: TerrainMap, t: number): boolean {
  return map.brickIndicesIn(shrink(tankRect(t))).length > 0
}

/**
 * 从 u 走到相邻的 v 要先打掉几层砖。打不掉时为 Infinity：要打老鹰外墙，或者这一层的砖都偏在两边
 * ——子弹只打得到坦克中线附近的砖，打中了才会把整层炸掉
 */
function layersToDig(map: TerrainMap, guard: Rect | null, u: number, v: number): number {
  const p = spotToTankPos(u)
  const depth = ITEM_SIZE_MAP.BRICK
  let count = 0
  for (let i = 0; i < 2; i += 1) {
    let layer: Rect
    let band: Rect
    if (v === u - N || v === u + N) {
      const y = v === u - N ? p.y - 8 + i * depth : p.y + 16 + i * depth
      layer = { x: p.x, y, width: BLOCK_SIZE, height: depth }
      band = { x: p.x + BULLET_OFFSET, y, width: BULLET_WIDTH, height: depth }
    } else {
      const x = v === u - 1 ? p.x - 8 + i * depth : p.x + 16 + i * depth
      layer = { x, y: p.y, width: depth, height: BLOCK_SIZE }
      band = { x, y: p.y + BULLET_OFFSET, width: depth, height: BULLET_WIDTH }
    }
    if (map.brickIndicesIn(shrink(layer)).length === 0) continue
    if (guard != null && testCollide(guard, layer, -EPS)) return Infinity
    if (map.brickIndicesIn(shrink(band)).length === 0) return Infinity
    count += 1
  }
  return count
}

export interface DigOptions {
  /** 每层砖折算成走几格；Infinity 表示只走现成的路 */
  layerCost?: number
  /** 暂时不走的 spot */
  avoid?: (t: number) => boolean
  /** 走到这个 spot 上另加的代价 */
  extraCost?: (t: number) => number
}

/** 允许打砖开路的最短路（Dijkstra）：走一格记 1，每层砖另加 layerCost */
export function digDistances(
  map: TerrainMap,
  start: number,
  { layerCost = BRICK_LAYER_COST, avoid, extraCost }: DigOptions = {},
): DigGraph {
  const dist = new Float64Array(N * N).fill(Infinity)
  const prev = new Int32Array(N * N).fill(-1)
  const passable = new Int8Array(N * N).fill(-1)
  const canStand = (t: number) => {
    if (passable[t] === -1) passable[t] = diggable(map, t) && !avoid?.(t) ? 1 : 0
    return passable[t] === 1
  }
  const guard = eagleGuard(map)
  const heap = new MinHeap()
  dist[start] = 0
  heap.push(start, 0)
  while (heap.size > 0) {
    const [u, d] = heap.pop()
    if (d > dist[u]) continue
    for (const dir of dirs) {
      const v = dir(u)
      if (v == null || !canStand(v)) continue
      const layers = layersToDig(map, guard, u, v)
      const cost = d + 1 + (layers === 0 ? 0 : layerCost * layers) + (extraCost?.(v) ?? 0)
      if (cost < dist[v]) {
        dist[v] = cost
        prev[v] = u
        heap.push(v, cost)
      }
    }
  }
  return { dist, prev }
}

/** 从起点到 end 的 spot 序列；到不了返回 null */
export function digPath(graph: DigGraph, end: number): number[] | null {
  if (graph.dist[end] === Infinity) return null
  const path = [end]
  while (graph.prev[path[0]] !== -1) {
    path.unshift(graph.prev[path[0]])
  }
  return path
}

class MinHeap {
  private readonly items: Array<[number, number]> = []

  get size(): number {
    return this.items.length
  }

  push(value: number, priority: number): void {
    const items = this.items
    items.push([value, priority])
    let i = items.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (items[parent][1] <= items[i][1]) break
      ;[items[parent], items[i]] = [items[i], items[parent]]
      i = parent
    }
  }

  pop(): [number, number] {
    const items = this.items
    const top = items[0]
    const last = items.pop()!
    if (items.length > 0) {
      items[0] = last
      let i = 0
      while (true) {
        const l = 2 * i + 1
        const r = l + 1
        let min = i
        if (l < items.length && items[l][1] < items[min][1]) min = l
        if (r < items.length && items[r][1] < items[min][1]) min = r
        if (min === i) break
        ;[items[min], items[i]] = [items[i], items[min]]
        i = min
      }
    }
    return top
  }
}
