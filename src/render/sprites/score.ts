import { path, rect } from './draw'

// 分数弹出 16×16：百位数字 + 两个 0
export const SCORES = [100, 200, 300, 400, 500] as const

const COLOR = '#ffffff'

type Rects = [number, number, number, number][]

const ZERO: Rects = [
  [1, 0, 2, 1],
  [1, 6, 2, 1],
  [0, 1, 1, 5],
  [3, 1, 1, 5],
]
const ONE: Rects = [
  [1, 1, 1, 1],
  [1, 6, 3, 1],
  [2, 0, 1, 7],
]
const TWO: Rects = [
  [0, 1, 1, 1],
  [1, 0, 2, 1],
  [3, 1, 1, 2],
  [2, 3, 1, 1],
  [1, 4, 1, 1],
  [0, 5, 1, 1],
  [0, 6, 4, 1],
]

function rects(ctx: CanvasRenderingContext2D, items: Rects, ox: number, oy: number): void {
  for (const [x, y, w, h] of items) {
    rect(ctx, ox + x, oy + y, w, h, COLOR)
  }
}

function drawDigit(ctx: CanvasRenderingContext2D, digit: number, x: number, y: number): void {
  switch (digit) {
    case 1:
      return rects(ctx, ONE, x, y)
    case 2:
      return rects(ctx, TWO, x, y)
    case 3:
      return path(
        ctx,
        `M${x},${y + 1} h1 v-1 h2 v1 h1 v2 h-1 v1 h1 v2 h-1 v1 h-2 v-1 h-1 v-1 h1 v1 h2 v-2 h-2 v-1 h2 v-2 h-2 v1 h-1 v-1`,
        COLOR,
      )
    case 4:
      return path(
        ctx,
        `M${x + 1},${y + 2} v-1 h1 v-1 h1 v4 h-1 v-2 h-1 v2 h3 v1 h-1 v2 h-1 v-2 h-2 v-3 h1`,
        COLOR,
      )
    case 5:
      return path(
        ctx,
        `M${x},${y} h4 v1 h-3 v1 h2 v1 h1 v3 h-1 v1 h-2 v-1 h-1 v-1 h1 v1 h2 v-3 h-3 v-3`,
        COLOR,
      )
  }
}

export function drawScore(ctx: CanvasRenderingContext2D, score: (typeof SCORES)[number]): void {
  drawDigit(ctx, score / 100, 1, 4)
  rects(ctx, ZERO, 6, 4)
  rects(ctx, ZERO, 11, 4)
}
