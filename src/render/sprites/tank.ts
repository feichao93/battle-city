import { TANK_COLOR_SCHEMES } from '../../engine/constants'
import type { TankColor, TankLevel, TankSide } from '../../engine/types'
import { bitmap, path, pixel, rect, type ColorScheme } from './draw'

// 坦克像素绘制（朝上，16×16）。坐标 1:1 抄自 app/components/tanks.tsx，
// 与 src/ui/pixel/TankSvg.tsx 的 SVG 版本一致。其它方向由渲染层旋转 sprite 处理；
// shape 0/1 为履带动画两帧。

type Shape = 0 | 1

function scheme(color: TankColor): ColorScheme & { a: string; b: string; c: string } {
  const { a, b, c } = TANK_COLOR_SCHEMES[color]
  return { a, b, c }
}

/** Basic 玩家坦克 */
export function drawBasicTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 5, 3, 9, a)
  rect(ctx, 2, 5, 1, 9, b)
  if (shape === 0) {
    bitmap(ctx, ['abb'], s, 1, 4)
    bitmap(ctx, ['abb'], s, 1, 14)
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 5 + 2 * i, 2, 1, c)
  } else {
    bitmap(ctx, ['acc'], s, 1, 4)
    bitmap(ctx, ['bcc'], s, 1, 14)
    for (let i = 0; i < 4; i += 1) rect(ctx, 1, 6 + 2 * i, 2, 1, c)
  }
  rect(ctx, 11, 4, 3, 11, c)
  pixel(ctx, 11, 4, a)
  if (shape === 0) {
    for (let i = 0; i < 6; i += 1) rect(ctx, 12, 4 + 2 * i, 2, 1, b)
  } else {
    for (let i = 0; i < 5; i += 1) rect(ctx, 12, 5 + 2 * i, 2, 1, b)
  }
  path(ctx, 'M4,7 h1 v-1 h1 v2 h-1 v3 h1 v1 h1 v1 h-2 v-1 h-1 v-5', a)
  pixel(ctx, 4, 12, c)
  path(ctx, 'M6,6 h1 v1 h3 v1 h1 v4 h-1 v1 h-3 v-1 h-1 v-1 h-1 v-3 h1 v-2', b)
  pixel(ctx, 10, 12, c)
  rect(ctx, 5, 13, 5, 1, c)
  rect(ctx, 8, 6, 2, 1, c)
  pixel(ctx, 10, 7, c)
  path(ctx, 'M6,8 h2 v1 h-1 v2 h-1 v-3', a)
  path(ctx, 'M8,9 h1 v3 h-2 v-1 h1 v-2', c)
  rect(ctx, 7, 2, 1, 5, a)
}

/** Fast 玩家坦克 */
function drawFastPlayerTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 5, 3, 11, a)
  rect(ctx, 2, 5, 2, 11, b)
  pixel(ctx, 3, 5, a)
  pixel(ctx, 3, 14, a)
  if (shape === 0) {
    bitmap(ctx, ['abb'], s, 1, 4)
    bitmap(ctx, ['ccc'], s, 1, 15)
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 5 + 2 * i, 2, 1, c)
  } else {
    bitmap(ctx, ['bcc'], s, 1, 4)
    bitmap(ctx, ['abb'], s, 1, 15)
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 6 + 2 * i, 2, 1, c)
  }
  rect(ctx, 11, 4, 3, 12, c)
  pixel(ctx, 11, 4, a)
  if (shape === 0) {
    for (let i = 0; i < 6; i += 1) rect(ctx, 12, 4 + 2 * i, 2, 1, b)
  } else {
    for (let i = 0; i < 6; i += 1) rect(ctx, 12, 5 + 2 * i, 2, 1, b)
    pixel(ctx, 11, 15, b)
  }
  path(ctx, 'M4,5 h2 v3 h-1 v5 h1 v1 h-2 v-9', a)
  rect(ctx, 6, 4, 1, 2, c)
  path(ctx, 'M8,4 h1 v1 h2 v10 h-7 v-1 h5 v-1 h1 v-5 h-1 v-2 h-1 v-2', c)
  path(ctx, 'M6,6 h1 v1 h1 v-1 h1 v2 h1 v5 h-1 v1 h-3 v-1 h-1 v-5 h1 v-2', b)
  path(ctx, 'M6,8 h2 v1 h-1 v3 h-1 v-4', a)
  path(ctx, 'M8,9 h1 v4 h-2 v-1 h1 v-3', c)
  rect(ctx, 7, 0, 1, 7, a)
}

/** Power 玩家坦克 */
function drawPowerPlayerTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 3, 1, 12, a)
  rect(ctx, 2, 3, 2, 12, b)
  if (shape === 0) {
    bitmap(ctx, ['bcc'], s, 1, 3)
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 5 + 2 * i, 1, 1, c)
  } else {
    bitmap(ctx, ['aaa'], s, 1, 3)
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 4 + 2 * i, 1, 1, c)
  }
  rect(ctx, 11, 3, 3, 12, c)
  if (shape === 0) {
    bitmap(ctx, ['a'], s, 11, 3)
    for (let i = 0; i < 6; i += 1) rect(ctx, 13, 4 + 2 * i, 1, 1, b)
  } else {
    bitmap(ctx, ['ab'], s, 11, 3)
    for (let i = 0; i < 6; i += 1) rect(ctx, 13, 3 + 2 * i, 1, 1, b)
  }
  path(ctx, 'M3,5 h2 v1 h-1 v5 h1 v1 h1 v1 h-2 v-1 h-1 v-7', a)
  pixel(ctx, 4, 4, c)
  rect(ctx, 5, 3, 1, 2, a)
  rect(ctx, 6, 3, 1, 2, c)
  path(ctx, 'M8,3 h2 v1 h1 v2 h-1 v-1 h-2 v-2', c)
  path(ctx, 'M10,11 h1 v3 h-7 v-1 h5 v-1 h1 v-1 h1', c)
  path(ctx, 'M5,5 h5 v1 h1 v5 h-1 v1 h-1 v1 h-3 v-1 h-1 v-1 h-1 v-5 h1 v-1', b)
  path(ctx, 'M6,6 h2 v1 h-1 v4 h-1 v-5', a)
  path(ctx, 'M8,7 h1 v5 h-2 v-1 h1 v-4', c)
  path(ctx, 'M6,0 h3 v2 h-1 v3 h-1 v-3 h-1 v-2', a)
  path(ctx, 'M8,0 h1 v2 h-2 v-1 h1 v-1', b)
}

/** Armor 玩家坦克 */
function drawArmorPlayerTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 1, 1, 14, a)
  rect(ctx, 2, 1, 2, 14, b)
  if (shape === 0) {
    for (let i = 0; i < 7; i += 1) rect(ctx, 1, 2 * i + 2, 1, 1, c)
    rect(ctx, 2, 14, 2, 1, c)
  } else {
    bitmap(ctx, ['bcc'], s, 1, 1)
    for (let i = 0; i < 6; i += 1) rect(ctx, 1, 2 * i + 3, 1, 1, c)
  }
  rect(ctx, 12, 1, 3, 14, b)
  pixel(ctx, 12, 1, a)
  if (shape === 0) {
    for (let i = 0; i < 6; i += 1) rect(ctx, 14, 2 * i + 2, 1, 1, c)
    rect(ctx, 13, 14, 2, 1, c)
  } else {
    for (let i = 0; i < 7; i += 1) rect(ctx, 14, 2 * i + 1, 1, 1, c)
    pixel(ctx, 13, 1, c)
  }
  path(ctx, 'M4,2 h3 v-2 h2 v2 h3 v3 h-1 v7 h-7 v-10', b)
  path(ctx, 'M3,2 h3 v3 h1 v-5 h1 v6 h-3 v6 h-1 v-9 h-1 v-1', a)
  rect(ctx, 9, 2, 1, 3, c)
  path(ctx, 'M6,7 h3 v1 h-2 v2 h-1 v-3', a)
  path(ctx, 'M9,8 h1 v3 h-3 v-1 h2 v-2', c)
  path(ctx, 'M12,3 h1 v10 h-1 v-1 h-1 v-7 h1 v-2', c)
  path(ctx, 'M4,12 h7 v1 h1 v1 h-9 v-1 h1 v-1', c)
  pixel(ctx, 11, 12, b)
  pixel(ctx, 12, 13, b)
  pixel(ctx, 13, 2, c)
  pixel(ctx, 12, 14, c)
  pixel(ctx, 13, 13, c)
}

/** Basic 敌方坦克 */
function drawBasicBotTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 3, 1, 11, a)
  rect(ctx, 2, 3, 2, 11, b)
  if (shape === 0) {
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 2 * i + 4, 2, 1, c)
  } else {
    bitmap(ctx, ['bcc'], s, 1, 3)
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 2 * i + 5, 2, 1, c)
  }
  rect(ctx, 11, 3, 3, 11, b)
  pixel(ctx, 11, 3, a)
  if (shape === 0) {
    for (let i = 0; i < 5; i += 1) rect(ctx, 12, 2 * i + 4, 2, 1, c)
    pixel(ctx, 7, 14, b)
  } else {
    for (let i = 0; i < 6; i += 1) rect(ctx, 12, 2 * i + 3, 2, 1, c)
    pixel(ctx, 7, 14, c)
  }
  path(ctx, 'M5,4 h1 v3 h-1 v4 h1 v2 h-1 v-1 h-1 v-7 h1 v-1', a)
  path(ctx, 'M8,3 h1 v1 h1 v1 h1 v7 h-1 v1 h-1 v1 h-3 v-1 h2 v-1 h1 v-1 h1 v-4 h-1 v-1 h-1 v-3', c)
  path(ctx, 'M6,3 h1 v3 h2 v1 h1 v4 h-1 v1 h-1 v1 h-2 v-2 h-1 v-4 h1 v-4', b)
  path(ctx, 'M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1', c)
  path(ctx, 'M8,8 h1 v2 h-2 v-1 h1 v-1', a)
  rect(ctx, 7, 0, 1, 6, a)
}

/** Fast 敌方坦克 */
function drawFastBotTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 2, 2, 3, c)
  rect(ctx, 1, 7, 2, 3, c)
  rect(ctx, 1, 12, 2, 3, c)
  if (shape === 0) {
    for (let i = 0; i < 3; i += 1) rect(ctx, 1, 5 * i + 2, 1, 1, b)
  } else {
    for (let i = 0; i < 3; i += 1) rect(ctx, 1, 5 * i + 3, 1, 1, b)
  }
  rect(ctx, 12, 2, 2, 3, c)
  rect(ctx, 12, 7, 2, 3, c)
  rect(ctx, 12, 12, 2, 3, c)
  if (shape === 0) {
    for (let i = 0; i < 3; i += 1) rect(ctx, 12, 5 * i + 2, 1, 1, b)
    pixel(ctx, 7, 14, a)
  } else {
    for (let i = 0; i < 3; i += 1) rect(ctx, 12, 5 * i + 3, 1, 1, b)
    pixel(ctx, 7, 14, b)
  }
  path(ctx, 'M4,2 h2 v4 h-1 v5 h1 v1 h3 v1 h-5 v1 h-1 v-11 h1 v-1', a)
  pixel(ctx, 9, 11, a)
  path(ctx, 'M3,4 h1 v1 h1 v1 h-1 v6 h2 v1 h-2 v1 h-1 v-10', b)
  rect(ctx, 6, 2, 1, 3, c)
  path(ctx, 'M8,2 h1 v2 h2 v11 h-3 v-1 h-1 v1 h-3 v-2 h5 v-1 h1 v-6 h-1 v-1 h-1 v-3', c)
  rect(ctx, 9, 2, 2, 2, b)
  rect(ctx, 11, 3, 1, 11, b)
  path(ctx, 'M6,5 h1 v1 h1 v-1 h1 v1 h1 v5 h-1 v1 h-3 v-1 h-1 v-5 h1 v-1', b)
  path(ctx, 'M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1', c)
  path(ctx, 'M8,8 h1 v2 h-2 v-1 h1 v-1', a)
  rect(ctx, 7, 0, 1, 6, a)
}

/** Power 敌方坦克 */
function drawPowerBotTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 3, 1, 12, a)
  rect(ctx, 2, 3, 2, 12, b)
  if (shape === 0) {
    for (let i = 0; i < 6; i += 1) rect(ctx, 1, 2 * i + 4, 2, 1, c)
  } else {
    bitmap(ctx, ['bcc'], s, 1, 3)
    for (let i = 0; i < 5; i += 1) rect(ctx, 1, 2 * i + 5, 2, 1, c)
  }
  rect(ctx, 11, 3, 3, 12, b)
  pixel(ctx, 11, 3, a)
  if (shape === 0) {
    for (let i = 0; i < 6; i += 1) rect(ctx, 12, 2 * i + 4, 2, 1, c)
    pixel(ctx, 7, 14, a)
  } else {
    for (let i = 0; i < 6; i += 1) rect(ctx, 12, 2 * i + 3, 2, 1, c)
    pixel(ctx, 7, 14, b)
  }
  path(ctx, 'M5,4 h1 v3 h-1 v4 h1 v1 h1 v2 h-2 v-2 h-1 v-7 h1 v-1', a)
  pixel(ctx, 6, 14, b)
  path(ctx, 'M6,3 h1 v3 h2 v1 h1 v4 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-4 h1 v-4', b)
  path(
    ctx,
    'M8,3 h1 v1 h1 v1 h1 v7 h-1 v2 h-1 v1 h-1 v-1 h-1 v-1 h1 v-1 h1 v-1 h1 v-4 h-1 v-1 h-1 v-3',
    c,
  )
  path(ctx, 'M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1', c)
  path(ctx, 'M8,8 h1 v2 h-2 v-1 h1 v-1', a)
  path(ctx, 'M6,0 h2 v6 h-1 v-5 h-1 v-1', a)
  pixel(ctx, 8, 0, b)
}

/** Armor 敌方坦克 */
function drawArmorBotTank(ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape): void {
  const s = scheme(color)
  const { a, b, c } = s
  rect(ctx, 1, 0, 1, 15, a)
  rect(ctx, 2, 0, 2, 15, b)
  if (shape === 0) {
    for (let i = 0; i < 7; i += 1) rect(ctx, 1, 2 * i + 1, 2, 1, c)
  } else {
    bitmap(ctx, ['bc'], s, 1, 0)
    for (let i = 0; i < 7; i += 1) rect(ctx, 1, 2 * i + 2, 2, 1, c)
  }
  rect(ctx, 11, 0, 3, 15, b)
  pixel(ctx, 11, 0, a)
  pixel(ctx, 11, 14, c)
  if (shape === 0) {
    for (let i = 0; i < 7; i += 1) rect(ctx, 12, 2 * i + 1, 2, 1, c)
    pixel(ctx, 7, 14, b)
  } else {
    for (let i = 0; i < 8; i += 1) rect(ctx, 12, 2 * i, 2, 1, c)
    pixel(ctx, 7, 14, a)
  }
  path(ctx, 'M4,1 h2 v-1 h3 v1 h2 v4 h-1 v7 h-5 v1 h-1 v-12', b)
  path(ctx, 'M6,0 h2 v6 h1 v-2 h1 v3 h-5 v5 h-1 v-9 h1 v2 h1 v1 h1 v-4 h-1 v-2', a)
  pixel(ctx, 5, 1, c)
  pixel(ctx, 9, 1, c)
  rect(ctx, 8, 2, 1, 4, c)
  path(ctx, 'M11,3 h1 v10 h-1 v-1 h-1 v-7 h1 v-2', c)
  path(ctx, 'M4,13 h1 v-1 h5 v1 h1 v1 h-7 v-1', c)
  pixel(ctx, 10, 12, b)
  path(ctx, 'M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1', c)
  path(ctx, 'M8,8 h1 v2 h-2 v-1 h1 v-1', a)
}

const PLAYER_DRAWERS: Record<TankLevel, (ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape) => void> = {
  basic: drawBasicTank,
  fast: drawFastPlayerTank,
  power: drawPowerPlayerTank,
  armor: drawArmorPlayerTank,
}

const BOT_DRAWERS: Record<TankLevel, (ctx: CanvasRenderingContext2D, color: TankColor, shape: Shape) => void> = {
  basic: drawBasicBotTank,
  fast: drawFastBotTank,
  power: drawPowerBotTank,
  armor: drawArmorBotTank,
}

/** 按阵营/等级派发到对应的坦克绘制函数 */
export function drawTank(
  ctx: CanvasRenderingContext2D,
  side: TankSide,
  level: TankLevel,
  color: TankColor,
  shape: Shape,
): void {
  const drawer = side === 'player' ? PLAYER_DRAWERS[level] : BOT_DRAWERS[level]
  drawer(ctx, color, shape)
}
