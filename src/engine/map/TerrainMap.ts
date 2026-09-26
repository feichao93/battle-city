import { ITEM_SIZE_MAP, N_MAP } from '../constants'
import { testCollide, type Rect } from '../physics/geometry'
import type { Point } from '../types'
import { parseStage, type ParsedStage } from './parseStage'
import type { RawStageConfig } from '../types'

/**
 * 持有一关的地形状态（可变）。
 * 子格用一维 boolean[] 存储，索引 = row * N + col。
 * P1 仅做只读查询/遍历；破坏逻辑（子弹打砖/钢）留待 P3。
 */
export default class TerrainMap {
  readonly bricks: boolean[]
  readonly steels: boolean[]
  readonly rivers: boolean[]
  readonly snows: boolean[]
  readonly forests: boolean[]
  eagle: Point | null
  /** 老鹰是否已被摧毁 */
  eagleBroken = false
  /** 地形（brick/steel）变动版本号，渲染层据此决定是否重烘焙 */
  version = 0

  constructor(parsed: ParsedStage) {
    this.bricks = parsed.bricks
    this.steels = parsed.steels
    this.rivers = parsed.rivers
    this.snows = parsed.snows
    this.forests = parsed.forests
    this.eagle = parsed.eagle
  }

  static fromRaw(raw: RawStageConfig): TerrainMap {
    return new TerrainMap(parseStage(raw))
  }

  /** 遍历某类地形所有被点亮的子格，回调拿到像素坐标 */
  private forEachCell(
    cells: boolean[],
    n: number,
    size: number,
    fn: (x: number, y: number, index: number) => void,
  ): void {
    for (let i = 0; i < cells.length; i += 1) {
      if (cells[i]) {
        const row = Math.floor(i / n)
        const col = i % n
        fn(col * size, row * size, i)
      }
    }
  }

  forEachBrick(fn: (x: number, y: number, index: number) => void): void {
    this.forEachCell(this.bricks, N_MAP.BRICK, ITEM_SIZE_MAP.BRICK, fn)
  }

  forEachSteel(fn: (x: number, y: number, index: number) => void): void {
    this.forEachCell(this.steels, N_MAP.STEEL, ITEM_SIZE_MAP.STEEL, fn)
  }

  forEachRiver(fn: (x: number, y: number, index: number) => void): void {
    this.forEachCell(this.rivers, N_MAP.RIVER, ITEM_SIZE_MAP.RIVER, fn)
  }

  forEachSnow(fn: (x: number, y: number, index: number) => void): void {
    this.forEachCell(this.snows, N_MAP.SNOW, ITEM_SIZE_MAP.SNOW, fn)
  }

  /** 像素坐标所在的 16×16 格是否为雪地（冰面）；越界返回 false */
  isSnowAt(px: number, py: number): boolean {
    const size = ITEM_SIZE_MAP.SNOW
    const col = Math.floor(px / size)
    const row = Math.floor(py / size)
    if (col < 0 || col >= N_MAP.SNOW || row < 0 || row >= N_MAP.SNOW) return false
    return this.snows[row * N_MAP.SNOW + col]
  }

  forEachForest(fn: (x: number, y: number, index: number) => void): void {
    this.forEachCell(this.forests, N_MAP.FOREST, ITEM_SIZE_MAP.FOREST, fn)
  }

  /**
   * 判断 rect 是否与某类地形的任一被点亮子格碰撞。
   * 只遍历 rect 覆盖范围内的子格（按 index 区间），而非全图扫描。
   */
  private collideCells(
    cells: boolean[],
    n: number,
    size: number,
    rect: Rect,
    threshold: number,
  ): boolean {
    const col1 = Math.max(0, Math.floor(rect.x / size))
    const col2 = Math.min(n - 1, Math.floor((rect.x + rect.width) / size))
    const row1 = Math.max(0, Math.floor(rect.y / size))
    const row2 = Math.min(n - 1, Math.floor((rect.y + rect.height) / size))
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        if (cells[row * n + col]) {
          const cell: Rect = { x: col * size, y: row * size, width: size, height: size }
          if (testCollide(cell, rect, threshold)) {
            return true
          }
        }
      }
    }
    return false
  }

  /** rect 是否撞上砖块（可被破坏） */
  collideBrick(rect: Rect, threshold: number): boolean {
    return this.collideCells(this.bricks, N_MAP.BRICK, ITEM_SIZE_MAP.BRICK, rect, threshold)
  }

  /** rect 是否撞上钢块 */
  collideSteel(rect: Rect, threshold: number): boolean {
    return this.collideCells(this.steels, N_MAP.STEEL, ITEM_SIZE_MAP.STEEL, rect, threshold)
  }

  /** rect 是否撞上河流（坦克不可通行，子弹可飞过） */
  collideRiver(rect: Rect, threshold: number): boolean {
    return this.collideCells(this.rivers, N_MAP.RIVER, ITEM_SIZE_MAP.RIVER, rect, threshold)
  }

  /** 收集 rect 覆盖范围内、被点亮的子格索引 */
  private collectIndices(cells: boolean[], n: number, size: number, rect: Rect): number[] {
    const result: number[] = []
    const col1 = Math.max(0, Math.floor(rect.x / size))
    const col2 = Math.min(n - 1, Math.floor((rect.x + rect.width) / size))
    const row1 = Math.max(0, Math.floor(rect.y / size))
    const row2 = Math.min(n - 1, Math.floor((rect.y + rect.height) / size))
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * n + col
        if (cells[t]) {
          result.push(t)
        }
      }
    }
    return result
  }

  /** rect 内被点亮的砖块子格索引 */
  brickIndicesIn(rect: Rect): number[] {
    return this.collectIndices(this.bricks, N_MAP.BRICK, ITEM_SIZE_MAP.BRICK, rect)
  }

  /** rect 内被点亮的钢块子格索引 */
  steelIndicesIn(rect: Rect): number[] {
    return this.collectIndices(this.steels, N_MAP.STEEL, ITEM_SIZE_MAP.STEEL, rect)
  }

  /** 砖块子格索引对应的像素矩形 */
  brickRectAt(t: number): Rect {
    const size = ITEM_SIZE_MAP.BRICK
    const n = N_MAP.BRICK
    return { x: (t % n) * size, y: Math.floor(t / n) * size, width: size, height: size }
  }

  /** 钢块子格索引对应的像素矩形 */
  steelRectAt(t: number): Rect {
    const size = ITEM_SIZE_MAP.STEEL
    const n = N_MAP.STEEL
    return { x: (t % n) * size, y: Math.floor(t / n) * size, width: size, height: size }
  }

  /** 移除若干砖块子格，有变动则 bump version */
  removeBricks(indices: Iterable<number>): void {
    let changed = false
    for (const t of indices) {
      if (this.bricks[t]) {
        this.bricks[t] = false
        changed = true
      }
    }
    if (changed) {
      this.version += 1
    }
  }

  /** 移除若干钢块子格，有变动则 bump version */
  removeSteels(indices: Iterable<number>): void {
    let changed = false
    for (const t of indices) {
      if (this.steels[t]) {
        this.steels[t] = false
        changed = true
      }
    }
    if (changed) {
      this.version += 1
    }
  }

  /** 摧毁老鹰 */
  destroyEagle(): void {
    this.eagleBroken = true
  }

  /** 收集 rect 覆盖范围内的全部子格索引（不论是否点亮） */
  private rangeIndices(n: number, size: number, rect: Rect): number[] {
    const result: number[] = []
    const col1 = Math.max(0, Math.floor(rect.x / size))
    const col2 = Math.min(n - 1, Math.floor((rect.x + rect.width) / size))
    const row1 = Math.max(0, Math.floor(rect.y / size))
    const row2 = Math.min(n - 1, Math.floor((rect.y + rect.height) / size))
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        result.push(row * n + col)
      }
    }
    return result
  }

  private cellOverlaps(rectOfCell: Rect, excludes: Rect[]): boolean {
    return excludes.some((e) => testCollide(e, rectOfCell, -0.1))
  }

  /**
   * shovel 道具：把老鹰四周的墙变为钢（mode='steel'）或砖（mode='brick'）。
   * excludes 为不应被墙覆盖的区域（老鹰本体、坦克）。
   */
  shovelConvert(mode: 'steel' | 'brick', excludes: Rect[]): void {
    if (this.eagle == null) {
      return
    }
    const box: Rect = { x: this.eagle.x - 8, y: this.eagle.y - 8, width: 31, height: 31 }

    if (mode === 'steel') {
      for (const t of this.rangeIndices(N_MAP.STEEL, ITEM_SIZE_MAP.STEEL, box)) {
        if (!this.cellOverlaps(this.steelRectAt(t), excludes)) {
          this.steels[t] = true
        }
      }
      for (const t of this.rangeIndices(N_MAP.BRICK, ITEM_SIZE_MAP.BRICK, box)) {
        this.bricks[t] = false
      }
    } else {
      for (const t of this.rangeIndices(N_MAP.BRICK, ITEM_SIZE_MAP.BRICK, box)) {
        if (!this.cellOverlaps(this.brickRectAt(t), excludes)) {
          this.bricks[t] = true
        }
      }
      for (const t of this.rangeIndices(N_MAP.STEEL, ITEM_SIZE_MAP.STEEL, box)) {
        this.steels[t] = false
      }
    }
    this.version += 1
  }
}
