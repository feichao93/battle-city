/**
 * 离屏 Canvas 2D 绘制原语。
 * 精灵坐标沿用 SVG <rect>/<path>/<Pixel> 的写法，映射到 Canvas 2D：
 * - rect  → fillRect
 * - path  → new Path2D(svgPathString) + fill（Canvas 原生支持 SVG path 语法）
 * - pixel → 1×1 fillRect
 * - bitmap→ 字符网格逐像素
 */
export type ColorScheme = Record<string, string>

export function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

export function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}

export function path(ctx: CanvasRenderingContext2D, d: string, color: string): void {
  ctx.fillStyle = color
  ctx.fill(new Path2D(d))
}

/** 字符网格：d 每行一个字符串，scheme 把字符映射到颜色（'none' 或缺失视为透明） */
export function bitmap(
  ctx: CanvasRenderingContext2D,
  d: string[],
  scheme: ColorScheme,
  ox = 0,
  oy = 0,
): void {
  for (let dy = 0; dy < d.length; dy += 1) {
    const row = d[dy]
    for (let dx = 0; dx < row.length; dx += 1) {
      const color = scheme[row[dx]]
      if (color && color !== 'none') {
        pixel(ctx, ox + dx, oy + dy, color)
      }
    }
  }
}
