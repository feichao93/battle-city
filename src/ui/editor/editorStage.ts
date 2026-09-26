import { BLOCK_SIZE, FIELD_BLOCK_SIZE, N_MAP } from '../../engine/constants'
import { parseStage } from '../../engine/map/parseStage'
import type { BotGroupConfig, MapItemType, RawStageConfig } from '../../engine/types'

/** 编辑器里的一个 block；hex 仅对砖 / 钢有效，每一位对应一个象限（1 左上 2 右上 4 左下 8 右下） */
export interface MapItem {
  type: MapItemType
  hex: number
}

export interface EditorStage {
  name: string
  difficulty: RawStageConfig['difficulty']
  /** 13×13 个 block，按行优先排列 */
  items: MapItem[]
  /** 固定 MAX_BOT_GROUPS 组，与原版编辑器一致 */
  bots: BotGroupConfig[]
}

export const MAX_BOT_GROUPS = 4

export const EMPTY_ITEM: MapItem = { type: 'X', hex: 0xf }

export const DEFAULT_BOTS: BotGroupConfig[] = [
  { tankLevel: 'basic', count: 10 },
  { tankLevel: 'fast', count: 4 },
  { tankLevel: 'power', count: 4 },
  { tankLevel: 'armor', count: 2 },
]

export function emptyEditorStage(): EditorStage {
  return {
    name: '',
    difficulty: 1,
    items: new Array<MapItem>(FIELD_BLOCK_SIZE ** 2).fill(EMPTY_ITEM),
    bots: DEFAULT_BOTS,
  }
}

/** 从子格还原 block：象限内任一子格存在即视为该象限存在（与原版 s2e 一致） */
export function rawToEditor(raw: RawStageConfig): EditorStage {
  const parsed = parseStage(raw)
  // 多出的组没有地方显示，保存时会被静默截掉
  if (parsed.bots.length > MAX_BOT_GROUPS) {
    throw new Error(`Editor supports at most ${MAX_BOT_GROUPS} bot groups`)
  }
  const items = new Array<MapItem>(FIELD_BLOCK_SIZE ** 2).fill(EMPTY_ITEM)
  const addQuadrant = (type: 'B' | 'T', t: number, bit: number) => {
    items[t] = items[t].type === type ? { type, hex: items[t].hex | bit } : { type, hex: bit }
  }

  parsed.bricks.forEach((set, i) => {
    if (!set) return
    const row = Math.floor(i / N_MAP.BRICK)
    const col = i % N_MAP.BRICK
    const t = Math.floor(row / 4) * FIELD_BLOCK_SIZE + Math.floor(col / 4)
    addQuadrant('B', t, 1 << (2 * (Math.floor(row / 2) % 2) + (Math.floor(col / 2) % 2)))
  })
  parsed.steels.forEach((set, i) => {
    if (!set) return
    const row = Math.floor(i / N_MAP.STEEL)
    const col = i % N_MAP.STEEL
    const t = Math.floor(row / 2) * FIELD_BLOCK_SIZE + Math.floor(col / 2)
    addQuadrant('T', t, 1 << (2 * (row % 2) + (col % 2)))
  })
  parsed.rivers.forEach((set, t) => set && (items[t] = { type: 'R', hex: 0xf }))
  parsed.forests.forEach((set, t) => set && (items[t] = { type: 'F', hex: 0xf }))
  parsed.snows.forEach((set, t) => set && (items[t] = { type: 'S', hex: 0xf }))
  if (parsed.eagle != null) {
    const t = (parsed.eagle.y / BLOCK_SIZE) * FIELD_BLOCK_SIZE + parsed.eagle.x / BLOCK_SIZE
    items[t] = { type: 'E', hex: 0xf }
  }

  const bots = DEFAULT_BOTS.map((_, i) => parsed.bots[i] ?? { tankLevel: 'basic', count: 0 })
  return { name: raw.name, difficulty: raw.difficulty, items, bots }
}

function serializeItem({ type, hex }: MapItem): string {
  if (type === 'B' || type === 'T') {
    return hex > 0 ? type + hex.toString(16) : 'X'
  }
  return type
}

export function editorToRaw(stage: EditorStage): RawStageConfig {
  const map: string[] = []
  for (let row = 0; row < FIELD_BLOCK_SIZE; row += 1) {
    const line = stage.items.slice(row * FIELD_BLOCK_SIZE, (row + 1) * FIELD_BLOCK_SIZE)
    map.push(line.map((item) => serializeItem(item).padEnd(3)).join(''))
  }
  return {
    // 像素字体只有小写字形，名称统一小写
    name: stage.name.toLowerCase(),
    difficulty: stage.difficulty,
    map,
    bots: stage.bots.filter((g) => g.count > 0).map((g) => `${g.count}*${g.tankLevel}`),
  }
}
