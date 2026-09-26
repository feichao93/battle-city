import { Texture } from 'pixi.js'
import type { ExplosionShape, TankColor } from '../engine/types'
import { rect } from './sprites/draw'
import { drawExplosion, explosionSize } from './sprites/explosion'
import { drawFlicker, FLICKER_SHAPES } from './sprites/flicker'
import { drawHelmet } from './sprites/helmet'
import { drawScore, SCORES } from './sprites/score'
import { drawPowerUp, POWER_UP_NAMES } from './sprites/powerup'
import {
  brickShape,
  drawBrick,
  drawEagleBroken,
  drawEagleInitial,
  drawForest,
  drawRiver,
  drawSnow,
  drawSteel,
} from './sprites/terrain'
import { drawTank } from './sprites/tank'

const TANK_COLORS: TankColor[] = ['yellow', 'green', 'silver', 'red']
const TANK_LEVELS = ['basic', 'fast', 'power', 'armor'] as const
const TANK_SIDES = ['player', 'bot'] as const

/**
 * 启动时把所有精灵的「Canvas 2D 绘制」栅格化为 PixiJS 纹理。
 * 纹理按原始像素尺寸生成（如 16×16），渲染层整体放大并用 NEAREST 采样保持像素风。
 */
export default class SpriteAtlas {
  private textures = new Map<string, Texture>()

  constructor() {
    this.build()
  }

  /** 取纹理；key 不存在时抛错（避免静默渲染空白） */
  get(key: string): Texture {
    const tex = this.textures.get(key)
    if (tex == null) {
      throw new Error(`SpriteAtlas: texture not found for key "${key}"`)
    }
    return tex
  }

  has(key: string): boolean {
    return this.textures.has(key)
  }

  private register(
    key: string,
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ): void {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx == null) {
      throw new Error('Failed to get 2d context for sprite rasterization')
    }
    draw(ctx)
    const texture = Texture.from(canvas)
    texture.source.scaleMode = 'nearest'
    this.textures.set(key, texture)
  }

  private build(): void {
    // 砖块两种 shape
    this.register('brick/true', 4, 4, (ctx) => drawBrick(ctx, true))
    this.register('brick/false', 4, 4, (ctx) => drawBrick(ctx, false))

    // 钢块
    this.register('steel', 8, 8, drawSteel)

    // 河流两帧
    this.register('river/0', 16, 16, (ctx) => drawRiver(ctx, 0))
    this.register('river/1', 16, 16, (ctx) => drawRiver(ctx, 1))

    // 森林、雪地
    this.register('forest', 16, 16, drawForest)
    this.register('snow', 16, 16, drawSnow)

    // 老鹰
    this.register('eagle/initial', 16, 16, drawEagleInitial)
    this.register('eagle/broken', 16, 16, drawEagleBroken)

    // 坦克：player/bot × 4 等级 × 4 色 × 2 shape，各等级有独立的精细形态。
    for (const side of TANK_SIDES) {
      for (const level of TANK_LEVELS) {
        for (const color of TANK_COLORS) {
          this.register(`tank/${side}/${level}/${color}/0`, 16, 16, (ctx) =>
            drawTank(ctx, side, level, color, 0),
          )
          this.register(`tank/${side}/${level}/${color}/1`, 16, 16, (ctx) =>
            drawTank(ctx, side, level, color, 1),
          )
        }
      }
    }

    // 子弹（3×3）
    this.register('bullet', 3, 3, (ctx) => rect(ctx, 0, 0, 3, 3, '#ADADAD'))

    // 爆炸各帧
    const explosionShapes: ExplosionShape[] = ['s0', 's1', 's2', 'b0', 'b1']
    for (const shape of explosionShapes) {
      const size = explosionSize(shape)
      this.register(`explosion/${shape}`, size, size, (ctx) => drawExplosion(ctx, shape))
    }

    // 道具
    for (const name of POWER_UP_NAMES) {
      this.register(`powerup/${name}`, 16, 16, (ctx) => drawPowerUp(ctx, name))
    }

    // 出生星星、头盔护盾
    for (const shape of FLICKER_SHAPES) {
      this.register(`flicker/${shape}`, 16, 16, (ctx) => drawFlicker(ctx, shape))
    }
    this.register('helmet/0', 16, 16, (ctx) => drawHelmet(ctx, 0))
    this.register('helmet/1', 16, 16, (ctx) => drawHelmet(ctx, 1))

    // 分数弹出
    for (const score of SCORES) {
      this.register(`score/${score}`, 16, 16, (ctx) => drawScore(ctx, score))
    }
  }
}

/** 砖块子格 (row,col) 对应的 shape key */
export function brickShapeKey(row: number, col: number): string {
  return `brick/${brickShape(row, col)}`
}
