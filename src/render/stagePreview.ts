import { FIELD_SIZE, ITEM_SIZE_MAP } from '../engine/constants'
import TerrainMap from '../engine/map/TerrainMap'
import type { RawStageConfig } from '../engine/types'
import { paintToDataUrl } from './canvasImage'
import {
  brickShape,
  drawBrick,
  drawEagleInitial,
  drawForest,
  drawRiver,
  drawSnow,
  drawSteel,
} from './sprites/terrain'

type Paint = (ctx: CanvasRenderingContext2D) => void

function at(ctx: CanvasRenderingContext2D, x: number, y: number, paint: Paint): void {
  ctx.save()
  ctx.translate(x, y)
  paint(ctx)
  ctx.restore()
}

/** 坦克之下的地形：河 → 钢 → 砖 → 雪 → 老鹰 */
function paintGround(ctx: CanvasRenderingContext2D, map: TerrainMap): void {
  map.forEachRiver((x, y) => at(ctx, x, y, (c) => drawRiver(c, 0)))
  map.forEachSteel((x, y) => at(ctx, x, y, drawSteel))
  map.forEachBrick((x, y) => {
    const shape = brickShape(y / ITEM_SIZE_MAP.BRICK, x / ITEM_SIZE_MAP.BRICK)
    at(ctx, x, y, (c) => drawBrick(c, shape))
  })
  map.forEachSnow((x, y) => at(ctx, x, y, drawSnow))
  if (map.eagle != null) {
    at(ctx, map.eagle.x, map.eagle.y, drawEagleInitial)
  }
}

function paintForest(ctx: CanvasRenderingContext2D, map: TerrainMap): void {
  map.forEachForest((x, y) => at(ctx, x, y, drawForest))
}

/** 地形分两层导出（透明底），森林层需盖在坦克之上 */
export function renderTerrainLayers(map: TerrainMap): { ground: string; forest: string } {
  return {
    ground: paintToDataUrl(FIELD_SIZE, FIELD_SIZE, (ctx) => paintGround(ctx, map)),
    forest: paintToDataUrl(FIELD_SIZE, FIELD_SIZE, (ctx) => paintForest(ctx, map)),
  }
}

const cache = new WeakMap<RawStageConfig, string>()

/** 关卡缩略图（data URL），与战场使用同一套地形精灵；按关卡对象缓存 */
export function renderStagePreview(stage: RawStageConfig): string {
  let url = cache.get(stage)
  if (url == null) {
    const map = TerrainMap.fromRaw(stage)
    url = paintToDataUrl(FIELD_SIZE, FIELD_SIZE, (ctx) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, FIELD_SIZE, FIELD_SIZE)
      paintGround(ctx, map)
      paintForest(ctx, map)
    })
    cache.set(stage, url)
  }
  return url
}
