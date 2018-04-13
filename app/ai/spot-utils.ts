import { BulletRecord } from '../types'

const N = 26

export const getRow = (t: number) => Math.floor(t / N)

export const getCol = (t: number) => t % N

export const left = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return col === 0 ? null : row * N + (col - 1)
}

export const right = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return col === N - 1 ? null : row * N + (col + 1)
}

export const up = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return row === 0 ? null : (row - 1) * N + col
}

export const down = (t: number) => {
  const row = getRow(t)
  const col = getCol(t)
  return row === N - 1 ? null : (row + 1) * N + col
}

export const dirs = [left, right, up, down]

export function around(t: number) {
  return [
    up(t),
    up(left(t)),
    left(t),
    down(left(t)),
    down(t),
    down(right(t)),
    right(t),
    right(up(t)),
  ].filter(x => x != null)
}

export const getTankSpot = (point: Point) => {
  const col = Math.round((point.x + 8) / 8)
  const row = Math.round((point.y + 8) / 8)
  return row * N + col
}

export function getBulletSpot(bullet: BulletRecord) {
  const col = Math.floor((bullet.x + 1) / 8)
  const row = Math.round((bullet.y + 1) / 8)
  return row * N + col
}
