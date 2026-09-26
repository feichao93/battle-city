import type { FlickerShape } from '../../engine/entities/Flicker'
import { rect } from './draw'

// 出生星星 16×16
const SHAPES: Record<FlickerShape, [number, number, number, number][]> = {
  0: [
    [3, 7, 9, 1],
    [6, 6, 3, 3],
    [7, 3, 1, 9],
  ],
  1: [
    [2, 7, 11, 1],
    [5, 6, 5, 3],
    [6, 5, 3, 5],
    [7, 2, 1, 11],
  ],
  2: [
    [1, 7, 13, 1],
    [4, 6, 7, 3],
    [6, 4, 3, 7],
    [7, 1, 1, 13],
  ],
  3: [
    [0, 7, 15, 1],
    [3, 6, 9, 3],
    [5, 5, 5, 5],
    [6, 3, 3, 9],
    [7, 0, 1, 15],
  ],
}

export const FLICKER_SHAPES: FlickerShape[] = [0, 1, 2, 3]

export function drawFlicker(ctx: CanvasRenderingContext2D, shape: FlickerShape): void {
  for (const [x, y, w, h] of SHAPES[shape]) {
    rect(ctx, x, y, w, h, '#ffffff')
  }
}
