import type TerrainMap from '../map/TerrainMap'
import type { Rect } from '../physics/geometry'
import { down, getCol, getRow, left, right, up, type DirFn } from './spots'

/** 开火估算：从 source 开火击中 target 需穿过的 brick / steel 数量 */
export interface FireEstimate {
  source: number
  target: number
  distance: number
  brickCount: number
  steelCount: number
}

/** 据 FireEstimate 计算 AI 需要开几枪才能打穿 */
export function getAIFireCount(est: FireEstimate): number {
  if (est.brickCount <= 3) return 1
  if (est.brickCount <= 5) return 2
  return 3
}

/** 火力阻力：钢块权重远大于砖块 */
export function getFireResist(est: FireEstimate): number {
  return est.brickCount + est.steelCount * 100
}

const e = 0.1

function anySteel(map: TerrainMap, r: Rect): boolean {
  return map.steelIndicesIn(r).length > 0
}
function anyBrick(map: TerrainMap, r: Rect): boolean {
  return map.brickIndicesIn(r).length > 0
}

/**
 * 从 spot t 沿四个方向逐格累计「打到该格所需穿过的砖/钢数」，得到一张 estMap。
 * 抄 app/ai/Spot.ts getIdealFireEstMap。
 */
export function getIdealFireEstMap(map: TerrainMap, t: number): Map<number, FireEstimate> {
  const estMap = new Map<number, FireEstimate>()
  estMap.set(t, { target: t, source: t, distance: 0, brickCount: 0, steelCount: 0 })

  for (const dir of [left, right, up, down] as DirFn[]) {
    let lastPos = t
    let cntPos = dir(lastPos)
    let brickCount = 0
    let steelCount = 0
    let distance = 8
    while (cntPos != null) {
      const start = { x: getCol(lastPos) * 8, y: getRow(lastPos) * 8 }
      const end = { x: getCol(cntPos) * 8, y: getRow(cntPos) * 8 }
      let r1: Rect
      let r2: Rect
      if (dir === left) {
        r1 = { x: end.x + 4 + e, y: end.y - e, width: 4 - 2 * e, height: 2 * e }
        r2 = { x: end.x + e, y: end.y - e, width: 4 - 2 * e, height: 2 * e }
      } else if (dir === right) {
        r1 = { x: start.x + e, y: start.y - e, width: 4 - 2 * e, height: 2 * e }
        r2 = { x: start.x + e + 4, y: start.y - e, width: 4 - 2 * e, height: 2 * e }
      } else if (dir === up) {
        r1 = { x: end.x - e, y: end.y + e + 4, width: 2 * e, height: 4 - 2 * e }
        r2 = { x: end.x - e, y: end.y + e, width: 2 * e, height: 4 - 2 * e }
      } else {
        r1 = { x: start.x - e, y: start.y + e, width: 2 * e, height: 4 - 2 * e }
        r2 = { x: start.x - e, y: start.y + e + 4, width: 2 * e, height: 4 - 2 * e }
      }

      const collidedWithSteel = anySteel(map, r1) || anySteel(map, r2)
      if (collidedWithSteel) {
        steelCount += 1
      } else {
        if (anyBrick(map, r1)) brickCount += 1
        if (anyBrick(map, r2)) brickCount += 1
      }

      estMap.set(cntPos, { source: cntPos, distance, target: t, brickCount, steelCount })
      lastPos = cntPos
      cntPos = dir(cntPos)
      distance += 8
    }
  }
  return estMap
}

function mergeEstMap(
  a: Map<number, FireEstimate>,
  b: Map<number, FireEstimate>,
): Map<number, FireEstimate> {
  for (const [key, value] of b.entries()) {
    const cur = a.get(key)
    if (cur == null || getFireResist(cur) < getFireResist(value)) {
      a.set(key, value)
    }
  }
  return a
}

/** 对多个弱点 spot 求并集 estMap；同一格取阻力更大者，沿用旧版 saga 的合并方式 */
export function calculateFireEstimateMap(
  weakSpots: number[],
  map: TerrainMap,
): Map<number, FireEstimate> {
  return weakSpots
    .map((s) => getIdealFireEstMap(map, s))
    .reduce((acc, m) => mergeEstMap(acc, m), new Map<number, FireEstimate>())
}
