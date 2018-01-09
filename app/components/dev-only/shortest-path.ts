import * as _ from 'lodash'
import { MapRecord } from 'types'
import { BLOCK_SIZE as BS, BULLET_SIZE, FIELD_BLOCK_SIZE as FBS } from 'utils/constants'
import IndexHelper from 'utils/IndexHelper'
import { testCollide } from 'utils/common'

const S = FBS * 2 - 1
const PANELTY = 3
const threshold = -0.01

const left = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return col === 0 ? null : row * S + (col - 1)
}
const right = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return col === S - 1 ? null : row * S + (col + 1)
}
const up = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return row === 0 ? null : (row - 1) * S + col
}
const down = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return row === S - 1 ? null : (row + 1) * S + col
}

const getRow = (t: number) => Math.floor(t / S)
const getCol = (t: number) => t % S

export type FireInfo = {
  t: number
  brickCount: number
  distance: number
}

export function calculateIdealFireInfoArray(map: MapRecord, target: number): FireInfo[] {
  const startFireInfo = { brickCount: 0, distance: 0, t: target }
  const result: FireInfo[] = [startFireInfo]
  for (const dir of [left, right, up, down]) {
    let cntPos = dir(target)
    let count = 0
    let distance = 8
    while (cntPos != null) {
      const row = getRow(cntPos)
      const col = getCol(cntPos)
      const bulletRect = {
        x: col * 8 + 8 - BULLET_SIZE / 2,
        y: row * 8 + 8 - BULLET_SIZE / 2,
        width: BULLET_SIZE,
        height: BULLET_SIZE,
      }
      const collidedWithSteel = Array.from(IndexHelper.iter('steel', bulletRect)).some(steelT =>
        map.steels.get(steelT),
      )
      if (collidedWithSteel) {
        break
      }
      const collidedWithBrick = Array.from(IndexHelper.iter('brick', bulletRect)).some(brickT =>
        map.bricks.get(brickT),
      )
      if (collidedWithBrick) {
        count++
      }
      // TODO count不一定就是brickCount
      result.push({ t: cntPos, brickCount: count, distance })
      cntPos = dir(cntPos)
      distance += 8
    }
  }
  return result
}

export interface PosInfo {
  canPass: boolean
  canFire?: boolean
  fireInfo?: FireInfo
}

export function getT(p: Point) {
  const col = Math.floor(p.x / 8)
  const row = Math.floor(p.y / 8)
  return row * (FBS * 2 - 1) + col
}

export function getPosInfo(map: MapRecord): PosInfo[] {
  const result: PosInfo[] = []
  for (const row of _.range(0, 2 * FBS - 1)) {
    next: for (const col of _.range(0, 2 * FBS - 1)) {
      const x = col * BS / 2
      const y = row * BS / 2
      const rect: Rect = { x, y, width: BS, height: BS }
      for (const t of IndexHelper.iter('brick', rect)) {
        if (map.bricks.get(t)) {
          const subject = IndexHelper.getRect('brick', t)
          if (testCollide(subject, rect, threshold)) {
            result.push({ canPass: false })
            continue next
          }
        }
      }
      for (const t of IndexHelper.iter('steel', rect)) {
        if (map.steels.get(t)) {
          const subject = IndexHelper.getRect('steel', t)
          if (testCollide(subject, rect, threshold)) {
            result.push({ canPass: false })
            continue next
          }
        }
      }
      for (const t of IndexHelper.iter('river', rect)) {
        if (map.rivers.get(t)) {
          const subject = IndexHelper.getRect('river', t)
          if (testCollide(subject, rect, threshold)) {
            result.push({ canPass: false })
            continue next
          }
        }
      }
      result.push({ canPass: true })
    }
  }
  return result
}

export interface PathInfo {
  score: number
  end: number
  path: number[]
}

export function shortestPathToEagle(posInfoArray: PosInfo[], start: number) {
  function getPath(end: number) {
    const path: number[] = []
    while (end !== start) {
      path.unshift(end)
      end = pre[end]
    }
    path.unshift(start)
    return path
  }

  const pre = new Array<number>(posInfoArray.length)
  const distance = new Array<number>(posInfoArray.length)
  pre.fill(-1)
  distance.fill(Infinity)

  let result: PathInfo = { score: Infinity, end: -1, path: [] }
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
      if (posInfo.canFire) {
        const score = step + posInfo.fireInfo.brickCount * PANELTY
        if (score < result.score) {
          result = { end: u, path: getPath(u), score }
        }
      }
      for (const dir of [left, right, up, down]) {
        const v = dir(u)
        if (v != null && distance[v] === Infinity) {
          next.add(v)
          pre[v] = u
        }
      }
    }
    cnt = next
  }

  return result
}
