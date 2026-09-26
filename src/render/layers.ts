import { Container, RenderTexture, Sprite, type Renderer as PixiRenderer } from 'pixi.js'
import { FIELD_SIZE, ITEM_SIZE_MAP } from '../engine/constants'
import type TerrainMap from '../engine/map/TerrainMap'
import SpriteAtlas, { brickShapeKey } from './SpriteAtlas'

/**
 * 把地形底层（steel → brick → snow）烘焙成单张 RenderTexture。
 * 关键：绝不为每个子格保留一个 Sprite —— 52² 砖块若各自成 Sprite 会拖垮性能。
 * 烘焙后用一个 Sprite 承载整张纹理；地形变动时（P3）再局部重绘。
 */
export function bakeTerrain(
  renderer: PixiRenderer,
  atlas: SpriteAtlas,
  map: TerrainMap,
): RenderTexture {
  const rt = RenderTexture.create({ width: FIELD_SIZE, height: FIELD_SIZE })
  const temp = new Container()

  map.forEachSteel((x, y) => {
    const s = new Sprite(atlas.get('steel'))
    s.position.set(x, y)
    temp.addChild(s)
  })
  map.forEachBrick((x, y) => {
    const row = y / ITEM_SIZE_MAP.BRICK
    const col = x / ITEM_SIZE_MAP.BRICK
    const s = new Sprite(atlas.get(brickShapeKey(row, col)))
    s.position.set(x, y)
    temp.addChild(s)
  })
  map.forEachSnow((x, y) => {
    const s = new Sprite(atlas.get('snow'))
    s.position.set(x, y)
    temp.addChild(s)
  })

  renderer.render({ container: temp, target: rt, clear: true })
  temp.destroy({ children: true })
  return rt
}

/** 把森林烘焙成单张 RenderTexture（顶层，盖在坦克/子弹之上） */
export function bakeForest(
  renderer: PixiRenderer,
  atlas: SpriteAtlas,
  map: TerrainMap,
): RenderTexture {
  const rt = RenderTexture.create({ width: FIELD_SIZE, height: FIELD_SIZE })
  const temp = new Container()
  map.forEachForest((x, y) => {
    const s = new Sprite(atlas.get('forest'))
    s.position.set(x, y)
    temp.addChild(s)
  })
  renderer.render({ container: temp, target: rt, clear: true })
  temp.destroy({ children: true })
  return rt
}

/** 把河流按指定帧烘焙成单张 RenderTexture；河流整关不变，两帧各烘焙一次后轮换 */
export function bakeRiver(
  renderer: PixiRenderer,
  atlas: SpriteAtlas,
  map: TerrainMap,
  shape: 0 | 1,
): RenderTexture {
  const rt = RenderTexture.create({ width: FIELD_SIZE, height: FIELD_SIZE })
  const temp = new Container()
  map.forEachRiver((x, y) => {
    const s = new Sprite(atlas.get(`river/${shape}`))
    s.position.set(x, y)
    temp.addChild(s)
  })
  renderer.render({ container: temp, target: rt, clear: true })
  temp.destroy({ children: true })
  return rt
}
