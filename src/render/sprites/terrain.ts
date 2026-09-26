import { bitmap, path, pixel, rect, type ColorScheme } from './draw'

/** 砖块子格 (row,col) 的纹理形状：相邻子格交错，拼出砖缝 */
export function brickShape(row: number, col: number): boolean {
  return (row + col) % 2 === 0
}

/** 砖块 4×4。坐标抄 app/components/BrickWall.tsx */
export function drawBrick(ctx: CanvasRenderingContext2D, shape: boolean): void {
  rect(ctx, 0, 0, 4, 4, '#636363')
  rect(ctx, shape ? 0 : 1, 0, shape ? 4 : 3, 3, '#6B0800')
  rect(ctx, shape ? 0 : 2, 1, shape ? 4 : 2, 2, '#9C4A00')
}

/** 钢块 8×8。坐标抄 app/components/SteelWall.tsx */
export function drawSteel(ctx: CanvasRenderingContext2D): void {
  rect(ctx, 0, 0, 8, 8, '#ADADAD')
  rect(ctx, 2, 2, 4, 4, '#FFFFFF')
  path(ctx, 'M6,2 h1 v-1 h1 v7 h-7 v-1 h1 v-1 h4 v-4', '#636363')
}

// 河流：两帧动画，每帧 8×8 高光点坐标。抄 app/components/River.tsx
const riverCoords: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [
    [5, 0],
    [0, 2],
    [1, 3],
    [4, 3],
    [3, 4],
    [5, 4],
    [1, 6],
    [2, 7],
    [6, 7],
  ],
  [
    [7, 0],
    [1, 1],
    [2, 2],
    [3, 3],
    [6, 3],
    [7, 4],
    [3, 5],
    [2, 6],
    [4, 6],
    [0, 7],
  ],
]

function drawRiverPart(ctx: CanvasRenderingContext2D, shape: 0 | 1, dx: number, dy: number): void {
  rect(ctx, dx, dy, 8, 8, '#4242FF')
  for (const [x, y] of riverCoords[shape]) {
    pixel(ctx, dx + x, dy + y, '#B5EFEF')
  }
}

/** 河流 16×16（4 个 8×8 part 平铺） */
export function drawRiver(ctx: CanvasRenderingContext2D, shape: 0 | 1): void {
  drawRiverPart(ctx, shape, 0, 0)
  drawRiverPart(ctx, shape, 8, 0)
  drawRiverPart(ctx, shape, 8, 8)
  drawRiverPart(ctx, shape, 0, 8)
}

// 森林：8×8 字符网格，四角平铺成 16×16。抄 app/components/Forest.tsx
const forestScheme: ColorScheme = { a: '#8CD600', b: '#005208', c: '#084A00', d: 'none' }
const forestGrid = [
  'dbbbcbad',
  'bbcacaca',
  'bbbccaaa',
  'cbbaabca',
  'bbacaaac',
  'bcbaaaaa',
  'aaaaacaa',
  'daacaaad',
]

/** 森林 16×16 */
export function drawForest(ctx: CanvasRenderingContext2D): void {
  bitmap(ctx, forestGrid, forestScheme, 0, 0)
  bitmap(ctx, forestGrid, forestScheme, 8, 0)
  bitmap(ctx, forestGrid, forestScheme, 0, 8)
  bitmap(ctx, forestGrid, forestScheme, 8, 8)
}

// 雪地：8×8 part，四角平铺。抄 app/components/Snow.tsx
const SNOW_A = '#ffffff'
const SNOW_B = '#adadad'
const SNOW_C = '#636363'

function drawSnowPart(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
  rect(ctx, dx, dy, 8, 8, SNOW_B)
  pixel(ctx, dx + 0, dy + 0, SNOW_C)
  pixel(ctx, dx + 3, dy + 0, SNOW_A)
  pixel(ctx, dx + 4, dy + 0, SNOW_C)
  pixel(ctx, dx + 0, dy + 3, SNOW_A)
  pixel(ctx, dx + 0, dy + 4, SNOW_C)
  for (let t = 0; t < 8; t += 1) pixel(ctx, dx + t, dy + 7 - t, SNOW_A)
  for (let t = 0; t < 7; t += 1) pixel(ctx, dx + 1 + t, dy + 7 - t, SNOW_C)
  for (let t = 0; t < 4; t += 1) pixel(ctx, dx + 4 + t, dy + 7 - t, SNOW_A)
  for (let t = 0; t < 3; t += 1) pixel(ctx, dx + 5 + t, dy + 7 - t, SNOW_C)
}

/** 雪地 16×16 */
export function drawSnow(ctx: CanvasRenderingContext2D): void {
  drawSnowPart(ctx, 0, 0)
  drawSnowPart(ctx, 8, 0)
  drawSnowPart(ctx, 8, 8)
  drawSnowPart(ctx, 0, 8)
}

// 老鹰 16×16。抄 app/components/Eagle.tsx
const eaglePoints: ReadonlyArray<readonly [number, number]> = [
  [8, 3],
  [3, 6],
  [4, 7],
  [6, 8],
  [9, 8],
  [11, 7],
  [12, 6],
]

/** 老鹰（完好） */
export function drawEagleInitial(ctx: CanvasRenderingContext2D): void {
  path(
    ctx,
    'M0,1 h2 v1 h1 v1 h1 v2 h2 v1 h1 v-3 h-1 v-1 h3 v1 h1 v1 h-1 v2 h1 v-1 h2 v-2 h1 v-1 h1 v-1 h2 v1 h-1 v1 h1 v1 h-1 v1 h1 v1 h-2 v1 h1 v1 h-1 v2 h-1 v1 h-3 v-1 h-1 v2 h1 v1 h2 v2 h-2 v-1 h-1 v1 h-2 v-1 h-1 v1 h-2 v-2 h2 v-1 h1 v-2 h-1 v1 h-3 v-1 h-1 v-2 h-1 v-1 h1 v-1 h-2 v-1 h1 v-1 h-1 v-1 h1 v-1 h-1 v-1',
    '#636363',
  )
  for (const [x, y] of eaglePoints) {
    pixel(ctx, x, y, '#6b0800')
  }
}

/** 老鹰（被摧毁） */
export function drawEagleBroken(ctx: CanvasRenderingContext2D): void {
  path(ctx, 'M1,8 h1 v-2 h1 v-1 h1 v-2 h1 v-1 h1 v2 h-1 v1 h-1 v2 h-1 v2 h-1 v7 h-1 v-8', '#9C4A00')
  path(
    ctx,
    'M7,3 h1 v1 h1 v1 h1 v1 h3 v1 h1 v2 h1 v2 h-1 v2 h-1 v-4 h-1 v2 h-1 v-1 h-2 v1 h-1 v2 h-1 v-1 h-2 v-1 h-2 v-1 h1 v-3 h1 v-2 h1 v-1 h1 v-1',
    '#636363',
  )
}
