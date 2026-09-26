import {
  brickShape,
  drawBrick,
  drawEagleInitial,
  drawForest,
  drawRiver,
  drawSnow,
  drawSteel,
} from '../../render/sprites/terrain'
import SpriteImage from '../pixel/SpriteImage'

export type TerrainIconName = 'brick' | 'steel' | 'river' | 'snow' | 'forest' | 'eagle'

/** brick / steel 为 8×8 的一个象限，其余为 16×16 整块 */
const ICONS: Record<TerrainIconName, [number, (ctx: CanvasRenderingContext2D) => void]> = {
  brick: [
    8,
    (ctx) => {
      for (const [row, col] of [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ]) {
        ctx.save()
        ctx.translate(col * 4, row * 4)
        drawBrick(ctx, brickShape(row, col))
        ctx.restore()
      }
    },
  ],
  steel: [8, drawSteel],
  river: [16, (ctx) => drawRiver(ctx, 0)],
  snow: [16, drawSnow],
  forest: [16, drawForest],
  eagle: [16, drawEagleInitial],
}

/** 编辑器工具栏的地形图标，与战场共用同一套精灵 */
export default function TerrainIcon({
  name,
  x,
  y,
  opacity = 1,
}: {
  name: TerrainIconName
  x: number
  y: number
  opacity?: number
}) {
  const [size, paint] = ICONS[name]
  return (
    <SpriteImage id={`terrain/${name}`} size={size} paint={paint} x={x} y={y} opacity={opacity} />
  )
}
