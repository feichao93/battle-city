import { BLOCK_SIZE, FIELD_BLOCK_SIZE, N_MAP } from '../constants'
import type { BotGroupConfig, Point, RawStageConfig, TankLevel } from '../types'

export interface ParsedStage {
  name: string
  difficulty: 1 | 2 | 3 | 4
  /** 52×52 子格，true 表示该 4px 砖块存在 */
  bricks: boolean[]
  /** 26×26 子格，true 表示该 8px 钢块存在 */
  steels: boolean[]
  /** 13×13 block */
  rivers: boolean[]
  /** 13×13 block */
  snows: boolean[]
  /** 13×13 block */
  forests: boolean[]
  /** 老鹰左上角像素坐标，null 表示该关卡无老鹰 */
  eagle: Point | null
  bots: BotGroupConfig[]
}

/**
 * 把砖块 item 的 hex 串解析为 16bit（每 4bit 描述一个 2×2 象限的 4 个子格）。
 * - 长度为 1：短格式，每一位扩展为对应象限「全有/全无」（0xf / 0x0）
 * - 长度为 4：完整格式，直接 parseInt
 */
export function parseBrickBits(str: string): number {
  if (str.length === 1) {
    const short = parseInt(str, 16)
    let long = 0
    if (0b0001 & short) long += 0xf000
    if (0b0010 & short) long += 0x0f00
    if (0b0100 & short) long += 0x00f0
    if (0b1000 & short) long += 0x000f
    return long
  } else if (str.length === 4) {
    return parseInt(str, 16)
  }
  throw new Error(`Invalid brick hex: ${str}`)
}

/** 把一个砖块 block 的 16bit 展开为 52×52 网格里被点亮的子格索引 */
function fillBrick(bricks: boolean[], row: number, col: number, bits: number): void {
  const brickRow = 4 * row
  const brickCol = 4 * col
  const N = N_MAP.BRICK // 52

  const set = (r: number, c: number) => {
    bricks[r * N + c] = true
  }

  const part0 = (bits >> 12) & 0xf
  part0 & 0b0001 && set(brickRow, brickCol)
  part0 & 0b0010 && set(brickRow, brickCol + 1)
  part0 & 0b0100 && set(brickRow + 1, brickCol)
  part0 & 0b1000 && set(brickRow + 1, brickCol + 1)

  const part1 = (bits >> 8) & 0xf
  part1 & 0b0001 && set(brickRow, brickCol + 2)
  part1 & 0b0010 && set(brickRow, brickCol + 3)
  part1 & 0b0100 && set(brickRow + 1, brickCol + 2)
  part1 & 0b1000 && set(brickRow + 1, brickCol + 3)

  const part2 = (bits >> 4) & 0xf
  part2 & 0b0001 && set(brickRow + 2, brickCol)
  part2 & 0b0010 && set(brickRow + 2, brickCol + 1)
  part2 & 0b0100 && set(brickRow + 3, brickCol)
  part2 & 0b1000 && set(brickRow + 3, brickCol + 1)

  const part3 = (bits >> 0) & 0xf
  part3 & 0b0001 && set(brickRow + 2, brickCol + 2)
  part3 & 0b0010 && set(brickRow + 2, brickCol + 3)
  part3 & 0b0100 && set(brickRow + 3, brickCol + 2)
  part3 & 0b1000 && set(brickRow + 3, brickCol + 3)
}

/** 把一个钢块 block 的 4bit 展开为 26×26 网格里被点亮的子格索引 */
function fillSteel(steels: boolean[], row: number, col: number, bits: number): void {
  const N = N_MAP.STEEL // 26
  if (bits & 0b0001) steels[2 * row * N + 2 * col] = true
  if (bits & 0b0010) steels[2 * row * N + 2 * col + 1] = true
  if (bits & 0b0100) steels[(2 * row + 1) * N + 2 * col] = true
  if (bits & 0b1000) steels[(2 * row + 1) * N + 2 * col + 1] = true
}

/**
 * 解析关卡地图字符串数组。
 * 每行 13 个 item（空格分隔），item 首字母标记类型，后续 hex 描述子格分布。
 * 类型：X 空 / B 砖 / T 钢 / R 河 / S 雪 / F 森林 / E 老鹰
 */
export function parseStageMap(map: string[]): Omit<ParsedStage, 'name' | 'difficulty' | 'bots'> {
  const bricks = new Array<boolean>(N_MAP.BRICK ** 2).fill(false)
  const steels = new Array<boolean>(N_MAP.STEEL ** 2).fill(false)
  const rivers = new Array<boolean>(N_MAP.RIVER ** 2).fill(false)
  const snows = new Array<boolean>(N_MAP.SNOW ** 2).fill(false)
  const forests = new Array<boolean>(N_MAP.FOREST ** 2).fill(false)
  let eagle: Point | null = null

  for (let row = 0; row < FIELD_BLOCK_SIZE; row += 1) {
    const line = map[row].toLowerCase().trim().split(/ +/)
    for (let col = 0; col < FIELD_BLOCK_SIZE; col += 1) {
      const item = line[col].trim()
      const type = item[0]
      if (type === 'b') {
        fillBrick(bricks, row, col, parseBrickBits(item.substring(1)))
      } else if (type === 't') {
        fillSteel(steels, row, col, parseInt(item[1], 16))
      } else if (type === 'r') {
        rivers[row * FIELD_BLOCK_SIZE + col] = true
      } else if (type === 's') {
        snows[row * FIELD_BLOCK_SIZE + col] = true
      } else if (type === 'f') {
        forests[row * FIELD_BLOCK_SIZE + col] = true
      } else if (type === 'e') {
        if (eagle != null) {
          throw new Error('Eagle appears more than once')
        }
        eagle = { x: col * BLOCK_SIZE, y: row * BLOCK_SIZE }
      } else if (type !== 'x') {
        throw new Error(`Invalid map item at row:${row} col:${col} -> "${item}"`)
      }
    }
  }

  return { bricks, steels, rivers, snows, forests, eagle }
}

/** 解析敌人描述数组，例如 ["18*basic", "2*fast"] */
export function parseStageBots(bots: string[]): BotGroupConfig[] {
  return bots.map((descriptor) => {
    const [countStr, level] = descriptor.split('*').map((s) => s.trim())
    const count = Number(countStr)
    if (Number.isNaN(count)) {
      throw new Error(`Invalid bot count in "${descriptor}"`)
    }
    if (!['basic', 'fast', 'power', 'armor'].includes(level)) {
      throw new Error(`Invalid tank level in "${descriptor}"`)
    }
    return { tankLevel: level as TankLevel, count }
  })
}

/** 把 bot 分组配置展开为按出场顺序排列的等级队列（共 20 个） */
export function expandBots(groups: BotGroupConfig[]): TankLevel[] {
  const queue: TankLevel[] = []
  for (const g of groups) {
    for (let i = 0; i < g.count; i += 1) {
      queue.push(g.tankLevel)
    }
  }
  return queue
}

export function parseStage(raw: RawStageConfig): ParsedStage {
  return {
    name: raw.name,
    difficulty: raw.difficulty,
    ...parseStageMap(raw.map),
    bots: parseStageBots(raw.bots),
  }
}
