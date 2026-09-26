import { paintToDataUrl } from '../../render/canvasImage'

const urls = new Map<string, string>()

interface SpriteImageProps {
  /** 缓存键，同一 id 只绘制一次 */
  id: string
  size: number
  paint: (ctx: CanvasRenderingContext2D) => void
  x?: number
  y?: number
  opacity?: number
}

/** 把战场精灵的 Canvas2D 绘制函数嵌入 SVG */
export default function SpriteImage({ id, size, paint, x = 0, y = 0, opacity }: SpriteImageProps) {
  let url = urls.get(id)
  if (url == null) {
    url = paintToDataUrl(size, size, paint)
    urls.set(id, url)
  }
  return <image href={url} x={x} y={y} width={size} height={size} opacity={opacity} />
}
