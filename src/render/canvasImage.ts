/** 用 Canvas2D 绘制并导出为 data URL，供 SVG <image> 复用战场精灵 */
export function paintToDataUrl(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d')!)
  return canvas.toDataURL()
}
