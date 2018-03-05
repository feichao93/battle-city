import * as _ from 'lodash'
import { MapRecord } from 'types'
import { testCollide } from 'utils/common'
import IndexHelper from 'utils/IndexHelper'

const N = 26
const threshold = -0.01
const e = 0.1

export const getTankT = (point: Point) => {
  const col = Math.floor((point.x + 8) / 8)
  const row = Math.floor((point.y + 8) / 8)
  return row * 26 + col
}
const left = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return col === 0 ? null : row * N + (col - 1)
}
const right = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return col === N - 1 ? null : row * N + (col + 1)
}
const up = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return row === 0 ? null : (row - 1) * N + col
}
const down = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return row === N - 1 ? null : (row + 1) * N + col
}

const getRow = (t: number) => Math.floor(t / N)
const getCol = (t: number) => t % N

export class PosInfo {
  constructor(readonly t: number, readonly canPass: boolean) {}

  getIdealFireEstMap(map: MapRecord): Map<number, FireEstimate> {
    const startEst: FireEstimate = {
      target: this.t,
      source: this.t,
      distance: 0,
      brickCount: 0,
      steelCount: 0,
    }
    const estMap = new Map<number, FireEstimate>()
    estMap.set(startEst.source, startEst)
    for (const dir of [left, right, up, down]) {
      let lastPos = this.t
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

        const collidedWithSteel =
          Array.from(IndexHelper.iter('steel', r1)).some(steelT => map.steels.get(steelT)) ||
          Array.from(IndexHelper.iter('steel', r2)).some(steelT => map.steels.get(steelT))
        if (collidedWithSteel) {
          steelCount++
        }

        const r1CollidedWithBrick = Array.from(IndexHelper.iter('brick', r1)).some(brickT =>
          map.bricks.get(brickT),
        )
        const r2CollidedWithBrick = Array.from(IndexHelper.iter('brick', r2)).some(brickT =>
          map.bricks.get(brickT),
        )
        if (r1CollidedWithBrick) {
          brickCount++
        }
        if (r2CollidedWithBrick) {
          brickCount++
        }

        const est = { source: cntPos, distance, target: this.t, brickCount, steelCount }
        estMap.set(est.source, est)
        lastPos = cntPos
        cntPos = dir(cntPos)
        distance += 8
      }
    }
    return estMap
  }
}

export interface FireEstimate {
  source: number
  target: number
  distance: number
  brickCount: number
  steelCount: number
  // 子弹需要穿过的物体的列表
  // penetration: {
  //   type: ItemType
  //   count: number
  // }[]
}

export function getPosInfoArray(map: MapRecord): PosInfo[] {
  const result: PosInfo[] = []
  for (const row of _.range(0, 26)) {
    next: for (const col of _.range(0, 26)) {
      const x = col * 8
      const y = row * 8
      const pos = row * 26 + col
      const rect: Rect = { x: x - 8, y: y - 8, width: 16, height: 16 }
      for (const t of IndexHelper.iter('brick', rect)) {
        if (map.bricks.get(t)) {
          const subject = IndexHelper.getRect('brick', t)
          if (testCollide(subject, rect, threshold)) {
            result.push(new PosInfo(pos, false))
            continue next
          }
        }
      }
      for (const t of IndexHelper.iter('steel', rect)) {
        if (map.steels.get(t)) {
          const subject = IndexHelper.getRect('steel', t)
          if (testCollide(subject, rect, threshold)) {
            result.push(new PosInfo(pos, false))
            continue next
          }
        }
      }
      for (const t of IndexHelper.iter('river', rect)) {
        if (map.rivers.get(t)) {
          const subject = IndexHelper.getRect('river', t)
          if (testCollide(subject, rect, threshold)) {
            result.push(new PosInfo(pos, false))
            continue next
          }
        }
      }
      result.push(new PosInfo(pos, true))
    }
  }
  return result
}

export interface PathInfo {
  score: number
  end: number
  path: number[]
}

export function shortestPath(
  posInfoArray: PosInfo[],
  start: number,
  stopCondition: (posInfo: PosInfo) => boolean,
  calculateScore: (step: number, posInfo: PosInfo) => number,
) {
  function getPath(end: number) {
    const path: number[] = []
    while (true) {
      path.unshift(end)
      if (end === start) {
        break
      }
      end = pre[end]
    }
    return path
  }

  const pre = new Array<number>(posInfoArray.length)
  const distance = new Array<number>(posInfoArray.length)
  pre.fill(-1)
  distance.fill(Infinity)

  let result: PathInfo = { score: Infinity, end: -1, path: null }
  let step = 0
  let cnt = new Set<number>()
  cnt.add(start)
  while (cnt.size > 0) {
    step++
    const next = new Set<number>()
    for (const u of cnt) {
      const posInfo = posInfoArray[u]
      if (!posInfo.canPass) {
        continue
      }
      distance[u] = step
      if (stopCondition(posInfo)) {
        const score = calculateScore(step, posInfo)
        if (score < result.score) {
          result = { end: u, path: null, score }
        }
      }
      for (const dir of [left, right, up, down]) {
        const v = dir(u)
        // TODO  这里看起来并不是最短路径，还需要再考虑考虑
        if (v != null && distance[v] === Infinity) {
          next.add(v)
          pre[v] = u
        }
      }
    }
    cnt = next
  }

  if (result.end !== -1) {
    result.path = getPath(result.end)
  }
  return result
}
