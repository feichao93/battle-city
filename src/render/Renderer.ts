import { Application, Container, Graphics, Sprite, type RenderTexture } from 'pixi.js'
import {
  BLOCK_SIZE,
  FIELD_SIZE,
  frame,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  TANK_SIZE,
  ZOOM_LEVEL,
} from '../engine/constants'
import type Bullet from '../engine/entities/Bullet'
import type Explosion from '../engine/entities/Explosion'
import type Flicker from '../engine/entities/Flicker'
import type PowerUp from '../engine/entities/PowerUp'
import type ScorePopup from '../engine/entities/ScorePopup'
import type Tank from '../engine/entities/Tank'
import type TerrainMap from '../engine/map/TerrainMap'
import type { Direction } from '../engine/types'
import { bakeForest, bakeRiver, bakeTerrain } from './layers'
import type SpriteAtlas from './SpriteAtlas'
import { tankColor } from './tankColor'

/** 履带动画：每 80ms 切换一帧，shape 0/1 循环 */
const TIRE_SHAPE_PERIOD = 160

/** 河流每 600ms 切换一帧（旧版 RiverLayer） */
const RIVER_PERIOD = 600

/** 头盔护盾每 2 帧切换一次 */
const HELMET_PERIOD = frame(2)

/** 各 sync 方法只读这些字段；联机客机用同形状的普通对象喂进来 */
export type TankView = Pick<
  Tank,
  | 'tankId'
  | 'alive'
  | 'side'
  | 'level'
  | 'color'
  | 'hp'
  | 'withPowerUp'
  | 'bornAt'
  | 'direction'
  | 'x'
  | 'y'
  | 'moving'
  | 'visible'
  | 'helmetDuration'
>
export type BulletView = Pick<Bullet, 'bulletId' | 'x' | 'y'>
export type ExplosionView = Pick<Explosion, 'id' | 'cx' | 'cy' | 'shape'>
export type PowerUpView = Pick<PowerUp, 'id' | 'name' | 'x' | 'y' | 'visible'>
export type FlickerView = Pick<Flicker, 'id' | 'x' | 'y' | 'shape'>
export type ScorePopupView = Pick<ScorePopup, 'id' | 'score' | 'x' | 'y' | 'visible'>

interface TankSpriteEntry {
  sprite: Sprite
  /** 停止移动时保留最后一帧 shape */
  lastShape: 0 | 1
}

const DIRECTION_ROTATION: Record<Direction, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
}

/**
 * PixiJS 渲染封装。manual render（autoStart:false，由外层显式调用 render）。
 * root(缩放 2x) → battlefield(偏移 16,16) → 各层，层序同旧版 BattleFieldScene：
 * 河流 → 地形 → 子弹 → 坦克 → 头盔 → 森林 → 道具 → 爆炸 → 出生星星 → 分数。
 */
export default class Renderer {
  private readonly root = new Container()
  private readonly battlefield = new Container()
  private readonly riverLayer = new Container()
  private readonly terrainLayer = new Container()
  private readonly bulletLayer = new Container()
  private readonly tankLayer = new Container()
  private readonly helmetLayer = new Container()
  private readonly forestLayer = new Container()
  private readonly powerUpLayer = new Container()
  private readonly explosionLayer = new Container()
  private readonly flickerLayer = new Container()
  private readonly scoreLayer = new Container()

  private readonly tankSprites = new Map<number, TankSpriteEntry>()
  private readonly bulletSprites = new Map<number, Sprite>()
  private readonly helmetSprites = new Map<number, Sprite>()
  private readonly explosionSprites = new Map<number, Sprite>()
  private readonly powerUpSprites = new Map<number, Sprite>()
  private readonly flickerSprites = new Map<number, Sprite>()
  private readonly scoreSprites = new Map<number, Sprite>()

  private terrainSprite: Sprite | null = null
  private riverSprite: Sprite | null = null
  private riverTextures: RenderTexture[] = []
  private forestTexture: RenderTexture | null = null
  private eagleSprite: Sprite | null = null
  private terrainVersion = -1
  private eagleBroken = false

  constructor(
    private readonly app: Application,
    private readonly atlas: SpriteAtlas,
  ) {
    this.root.scale.set(ZOOM_LEVEL)
    this.battlefield.position.set(BLOCK_SIZE, BLOCK_SIZE)

    // 屏幕灰色底（NES 风格的边框 + HUD 面板背景），HUD 由 React SVG overlay 绘制
    const screenBg = new Graphics().rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x757575)
    // 战场黑色背景（13×13 block）
    const bg = new Graphics().rect(0, 0, FIELD_SIZE, FIELD_SIZE).fill(0x000000)
    this.battlefield.addChild(bg, ...this.layers)

    this.root.addChild(screenBg, this.battlefield)
    this.app.stage.addChild(this.root)
  }

  private get layers(): Container[] {
    return [
      this.riverLayer,
      this.terrainLayer,
      this.bulletLayer,
      this.tankLayer,
      this.helmetLayer,
      this.forestLayer,
      this.powerUpLayer,
      this.explosionLayer,
      this.flickerLayer,
      this.scoreLayer,
    ]
  }

  /** 装载一关：烘焙地形 + 老鹰 + 森林。会清空上一关的内容。 */
  mountStage(map: TerrainMap): void {
    this.destroyBakedTextures()
    for (const layer of this.layers) {
      layer.removeChildren().forEach((c) => c.destroy())
    }
    this.tankSprites.clear()
    for (const pool of [
      this.bulletSprites,
      this.helmetSprites,
      this.explosionSprites,
      this.powerUpSprites,
      this.flickerSprites,
      this.scoreSprites,
    ]) {
      pool.clear()
    }

    this.riverTextures = [
      bakeRiver(this.app.renderer, this.atlas, map, 0),
      bakeRiver(this.app.renderer, this.atlas, map, 1),
    ]
    this.riverSprite = new Sprite(this.riverTextures[0])
    this.riverLayer.addChild(this.riverSprite)

    const terrainTex = bakeTerrain(this.app.renderer, this.atlas, map)
    this.terrainSprite = new Sprite(terrainTex)
    this.terrainLayer.addChild(this.terrainSprite)
    this.terrainVersion = map.version

    this.eagleBroken = false
    if (map.eagle != null) {
      this.eagleSprite = new Sprite(this.atlas.get('eagle/initial'))
      this.eagleSprite.position.set(map.eagle.x, map.eagle.y)
      this.terrainLayer.addChild(this.eagleSprite)
    } else {
      this.eagleSprite = null
    }

    this.forestTexture = bakeForest(this.app.renderer, this.atlas, map)
    this.forestLayer.addChild(new Sprite(this.forestTexture))
  }

  /** 烘焙纹理不归图集管理，换关 / 销毁时手动释放 */
  private destroyBakedTextures(): void {
    this.terrainSprite?.texture.destroy(true)
    this.forestTexture?.destroy(true)
    for (const tex of this.riverTextures) {
      tex.destroy(true)
    }
    this.terrainSprite = null
    this.forestTexture = null
    this.riverTextures = []
  }

  /** 河流轮换帧；地形（砖/钢）变动时重新烘焙底层纹理；老鹰被毁时切换破损贴图。 */
  syncTerrain(map: TerrainMap, time: number): void {
    if (this.riverSprite != null) {
      this.riverSprite.texture = this.riverTextures[Math.floor(time / RIVER_PERIOD) % 2]
    }
    if (map.version !== this.terrainVersion && this.terrainSprite != null) {
      const old = this.terrainSprite.texture
      this.terrainSprite.texture = bakeTerrain(this.app.renderer, this.atlas, map)
      old.destroy(true)
      this.terrainVersion = map.version
    }
    if (map.eagleBroken && !this.eagleBroken && this.eagleSprite != null) {
      this.eagleSprite.texture = this.atlas.get('eagle/broken')
      this.eagleBroken = true
    }
  }

  /**
   * 每帧把坦克实体同步到 sprite：位置取格子中心（anchor 0.5 + rotation 表现朝向），
   * 履带 shape 由 moving + 仿真时间决定。已消失的坦克回收其 sprite。
   */
  syncTanks(tanks: TankView[], time: number): void {
    const seen = new Set<number>()
    for (const tank of tanks) {
      if (!tank.alive) {
        continue
      }
      seen.add(tank.tankId)
      let entry = this.tankSprites.get(tank.tankId)
      if (entry == null) {
        const sprite = new Sprite()
        sprite.anchor.set(0.5)
        this.tankLayer.addChild(sprite)
        entry = { sprite, lastShape: 0 }
        this.tankSprites.set(tank.tankId, entry)
      }
      const shape: 0 | 1 = tank.moving
        ? ((Math.floor((time % TIRE_SHAPE_PERIOD) / 80) === 0 ? 0 : 1) as 0 | 1)
        : entry.lastShape
      entry.lastShape = shape
      const color = tankColor(tank, time)
      entry.sprite.texture = this.atlas.get(`tank/${tank.side}/${tank.level}/${color}/${shape}`)
      entry.sprite.rotation = DIRECTION_ROTATION[tank.direction]
      entry.sprite.position.set(tank.x + TANK_SIZE / 2, tank.y + TANK_SIZE / 2)
      entry.sprite.visible = tank.visible
    }
    for (const [id, entry] of this.tankSprites) {
      if (!seen.has(id)) {
        entry.sprite.destroy()
        this.tankSprites.delete(id)
      }
    }

    const helmetKey = `helmet/${Math.floor(time / HELMET_PERIOD) % 2}`
    this.syncPool(
      this.helmetSprites,
      this.helmetLayer,
      tanks.filter((t) => t.alive && t.helmetDuration > 0),
      (t) => t.tankId,
      (sprite, t) => {
        sprite.texture = this.atlas.get(helmetKey)
        sprite.position.set(t.x, t.y)
      },
    )
  }

  /** 同步子弹 sprite（3×3，左上角对齐 bullet.x/y） */
  syncBullets(bullets: BulletView[]): void {
    this.syncPool(
      this.bulletSprites,
      this.bulletLayer,
      bullets,
      (b) => b.bulletId,
      (sprite, b) => {
        sprite.texture = this.atlas.get('bullet')
        sprite.position.set(b.x, b.y)
      },
    )
  }

  /** 同步爆炸 sprite（anchor 0.5 居中于 cx/cy，逐帧切换 shape） */
  syncExplosions(explosions: ExplosionView[]): void {
    this.syncPool(
      this.explosionSprites,
      this.explosionLayer,
      explosions,
      (e) => e.id,
      (sprite, e) => {
        sprite.anchor.set(0.5)
        sprite.position.set(e.cx, e.cy)
        sprite.texture = this.atlas.get(`explosion/${e.shape()}`)
      },
    )
  }

  /** 同步道具 sprite（16×16，闪烁时切换可见性） */
  syncPowerUps(powerUps: PowerUpView[]): void {
    this.syncPool(
      this.powerUpSprites,
      this.powerUpLayer,
      powerUps,
      (p) => p.id,
      (sprite, p) => {
        sprite.texture = this.atlas.get(`powerup/${p.name}`)
        sprite.position.set(p.x, p.y)
        sprite.visible = p.visible
      },
    )
  }

  /** 同步出生星星 sprite */
  syncFlickers(flickers: FlickerView[]): void {
    this.syncPool(
      this.flickerSprites,
      this.flickerLayer,
      flickers,
      (f) => f.id,
      (sprite, f) => {
        sprite.texture = this.atlas.get(`flicker/${f.shape()}`)
        sprite.position.set(f.x, f.y)
      },
    )
  }

  /** 同步分数弹出 sprite */
  syncScorePopups(popups: ScorePopupView[]): void {
    this.syncPool(
      this.scoreSprites,
      this.scoreLayer,
      popups,
      (p) => p.id,
      (sprite, p) => {
        sprite.texture = this.atlas.get(`score/${p.score}`)
        sprite.position.set(p.x, p.y)
        sprite.visible = p.visible
      },
    )
  }

  /** 按 id 把实体列表同步到 sprite 池：新实体建 sprite，消失的回收 */
  private syncPool<T>(
    pool: Map<number, Sprite>,
    layer: Container,
    items: T[],
    idOf: (item: T) => number,
    update: (sprite: Sprite, item: T) => void,
  ): void {
    const seen = new Set<number>()
    for (const item of items) {
      const id = idOf(item)
      seen.add(id)
      let sprite = pool.get(id)
      if (sprite == null) {
        sprite = new Sprite()
        layer.addChild(sprite)
        pool.set(id, sprite)
      }
      update(sprite, item)
    }
    for (const [id, sprite] of pool) {
      if (!seen.has(id)) {
        sprite.destroy()
        pool.delete(id)
      }
    }
  }

  /** 显式渲染一帧 */
  render(): void {
    this.app.renderer.render(this.app.stage)
  }

  destroy(): void {
    this.destroyBakedTextures()
    this.root.destroy({ children: true })
  }
}
