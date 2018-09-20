import { List, Record, Repeat } from 'immutable'
import { EagleRecord, MapRecord } from '../types'
import { or } from '../utils/common'
import { BLOCK_SIZE, FIELD_BLOCK_SIZE, N_MAP } from '../utils/constants'
import IndexHelper from '../utils/IndexHelper'

export type MapItemType = 'X' | 'E' | 'B' | 'T' | 'R' | 'S' | 'F'

const MapItemRecord = Record({
  type: 'X' as MapItemType,
  hex: 0xf,
})

export interface EditorStageConfig {
  name: string
  difficulty: StageDifficulty
  custom: boolean
  itemList: List<MapItem>
  bots: List<BotGroupConfig>
}

function serializeMapItemList(list: List<MapItem>): string[] {
  const result: string[] = []
  for (let row = 0; row < FIELD_BLOCK_SIZE; row += 1) {
    const array: string[] = []
    for (let col = 0; col < FIELD_BLOCK_SIZE; col += 1) {
      const { type, hex } = list.get(row * FIELD_BLOCK_SIZE + col)
      if (type === 'B') {
        if (hex > 0) {
          array.push('B' + hex.toString(16))
        } else {
          array.push('X')
        }
      } else if (type === 'E') {
        array.push('E')
      } else if (type === 'R') {
        array.push('R')
      } else if (type === 'S') {
        array.push('S')
      } else if (type === 'T') {
        if (hex > 0) {
          array.push('T' + hex.toString(16))
        } else {
          array.push('X')
        }
      } else if (type === 'F') {
        array.push('F')
      } else {
        array.push('X')
      }
    }
    result.push(array.map(s => s.padEnd(3)).join(''))
  }
  return result
}

export class MapItem extends MapItemRecord {}

export type StageDifficulty = 1 | 2 | 3 | 4

/** 关卡配置文件的格式 */
export interface RawStageConfig {
  name: string
  // 是否为自定义的关卡
  custom: boolean
  difficulty: StageDifficulty
  map: string[]
  /** 敌人描述, 例如: 20\*basic, 10\*fast */
  bots: string[]
}

export class BotGroupConfig extends Record({
  tankLevel: 'basic' as TankLevel,
  count: 0,
}) {
  static fromJS(object: any) {
    return new BotGroupConfig(object)
  }

  static unwind(botGroupConfig: BotGroupConfig) {
    return Repeat(botGroupConfig.tankLevel, botGroupConfig.count)
  }

  incTankLevel() {
    if (this.tankLevel === 'basic') {
      return this.set('tankLevel', 'fast')
    } else if (this.tankLevel === 'fast') {
      return this.set('tankLevel', 'power')
    } else {
      return this.set('tankLevel', 'armor')
    }
  }

  decTankLevel() {
    if (this.tankLevel === 'armor') {
      return this.set('tankLevel', 'power')
    } else if (this.tankLevel === 'power') {
      return this.set('tankLevel', 'fast')
    } else {
      return this.set('tankLevel', 'basic')
    }
  }
}

export const defaultBotsConfig = List<BotGroupConfig>([
  new BotGroupConfig({ tankLevel: 'basic', count: 10 }),
  new BotGroupConfig({ tankLevel: 'fast', count: 4 }),
  new BotGroupConfig({ tankLevel: 'power', count: 4 }),
  new BotGroupConfig({ tankLevel: 'armor', count: 2 }),
])

const StageConfigRecord = Record({
  name: '',
  custom: false,
  difficulty: 1 as StageDifficulty,
  map: new MapRecord(),
  // TODO renames to bots
  bots: defaultBotsConfig,
})

export default class StageConfig extends StageConfigRecord {
  static fromRawStageConfig(object: RawStageConfig) {
    return new StageConfig({
      name: object.name,
      custom: object.custom,
      difficulty: object.difficulty,
      map: StageConfig.parseStageMap(object.map),
      bots: StageConfig.parseStageBots(object.bots),
    })
  }

  static parseBrickBits(str: string) {
    if (str.length === 1) {
      const short = parseInt(str, 16)
      let long = 0
      if (0b0001 & short) {
        long += 0xf000
      }
      if (0b0010 & short) {
        long += 0x0f00
      }
      if (0b0100 & short) {
        long += 0x00f0
      }
      if (0b1000 & short) {
        long += 0x000f
      }
      return long
    } else if (str.length === 4) {
      return parseInt(str, 16)
    }
  }

  /**
   * 解析关卡文件中的地图配置.
   * 地图配置数据格式为 string[], 数组中每一个string对应地图中的一行.
   * 一行中包含16个item(由一个或多个空格分隔开来), 对应地图一行的16个block
   * item的第一个字符标记了block的类型, 各个字母的含义见上方
   * item后续字符(如果存在的话)为十六进制格式, 用来表示该block中哪些部分包含了地图元素
   * 空白 XX
   * 砖块 brick  B<n>
   * 河流 river  R
   * 雪地 snow   S
   * 森林 forest F
   * 钢块 steel  T<n>
   * 老鹰 eagle  E
   */
  static parseStageMap(map: RawStageConfig['map']) {
    const bricks = new Set<number>()
    const steels = new Set<number>()
    const rivers = new Set<number>()
    const snows = new Set<number>()
    const forests = new Set<number>()
    let eaglePos: Point = null
    for (let row = 0; row < FIELD_BLOCK_SIZE; row += 1) {
      const line = map[row].toLowerCase().split(/ +/)
      for (let col = 0; col < FIELD_BLOCK_SIZE; col += 1) {
        const item = line[col].trim()
        if (item[0] === 'b') {
          // brick
          const bits = StageConfig.parseBrickBits(item.substring(1))
          const brickRow = 4 * row
          const brickCol = 4 * col
          const N = 52

          const part0 = (bits >> 12) & 0xf
          part0 & 0b0001 && bricks.add(brickRow * N + brickCol + 0)
          part0 & 0b0010 && bricks.add(brickRow * N + brickCol + 1)
          part0 & 0b0100 && bricks.add(brickRow * N + brickCol + N)
          part0 & 0b1000 && bricks.add(brickRow * N + brickCol + N + 1)

          const part1 = (bits >> 8) & 0xf
          part1 & 0b0001 && bricks.add(brickRow * N + brickCol + 2 + 0)
          part1 & 0b0010 && bricks.add(brickRow * N + brickCol + 2 + 1)
          part1 & 0b0100 && bricks.add(brickRow * N + brickCol + 2 + N)
          part1 & 0b1000 && bricks.add(brickRow * N + brickCol + 2 + N + 1)

          const part2 = (bits >> 4) & 0xf
          part2 & 0b0001 && bricks.add((brickRow + 2) * N + brickCol + 0)
          part2 & 0b0010 && bricks.add((brickRow + 2) * N + brickCol + 1)
          part2 & 0b0100 && bricks.add((brickRow + 2) * N + brickCol + N)
          part2 & 0b1000 && bricks.add((brickRow + 2) * N + brickCol + N + 1)

          const part3 = (bits >> 0) & 0xf
          part3 & 0b0001 && bricks.add((brickRow + 2) * N + brickCol + 2 + 0)
          part3 & 0b0010 && bricks.add((brickRow + 2) * N + brickCol + 2 + 1)
          part3 & 0b0100 && bricks.add((brickRow + 2) * N + brickCol + 2 + N)
          part3 & 0b1000 && bricks.add((brickRow + 2) * N + brickCol + 2 + N + 1)
        } else if (item[0] === 't') {
          const bits = parseInt(item[1], 16)
          DEV.ASSERT && console.assert(0 < bits && bits < 16)
          if (bits & 0b0001) {
            steels.add(2 * row * 26 + 2 * col)
          }
          if (bits & 0b0010) {
            steels.add(2 * row * 26 + 2 * col + 1)
          }
          if (bits & 0b0100) {
            steels.add((2 * row + 1) * 26 + 2 * col)
          }
          if (bits & 0b1000) {
            steels.add((2 * row + 1) * 26 + 2 * col + 1)
          }
        } else if (item[0] === 'r') {
          rivers.add(row * FIELD_BLOCK_SIZE + col)
        } else if (item[0] === 'f') {
          forests.add(row * FIELD_BLOCK_SIZE + col)
        } else if (item[0] === 's') {
          snows.add(row * FIELD_BLOCK_SIZE + col)
        } else if (item[0] === 'e') {
          if (eaglePos != null) {
            throw new Error('Eagle appears more than once')
          } else {
            eaglePos = {
              x: col * BLOCK_SIZE,
              y: row * BLOCK_SIZE,
            }
          }
        } else if (item[0] !== 'x') {
          throw new Error(`Invalid map at row:${row} col:${col}`)
        }
      }
    }

    return new MapRecord({
      eagle: eaglePos
        ? new EagleRecord({
            x: eaglePos.x,
            y: eaglePos.y,
            broken: false,
          })
        : null,
      bricks: Repeat(false, N_MAP.BRICK ** 2)
        .map((set, index) => bricks.has(index))
        .toList(),
      steels: Repeat(false, N_MAP.STEEL ** 2)
        .map((set, index) => steels.has(index))
        .toList(),
      rivers: Repeat(false, N_MAP.RIVER ** 2)
        .map((set, index) => rivers.has(index))
        .toList(),
      snows: Repeat(false, N_MAP.SNOW ** 2)
        .map((set, index) => snows.has(index))
        .toList(),
      forests: Repeat(false, N_MAP.FOREST ** 2)
        .map((set, index) => forests.has(index))
        .toList(),
    })
  }

  static parseStageBots(bots: RawStageConfig['bots']) {
    const array: BotGroupConfig[] = []
    for (const descriptor of bots) {
      const splited = descriptor.split('*').map(s => s.trim())
      DEV.ASSERT && console.assert(splited.length === 2)

      const count = Number(splited[0])
      const tankLevel = splited[1] as TankLevel
      DEV.ASSERT && console.assert(!isNaN(count))
      DEV.ASSERT && console.assert(['basic', 'fast', 'power', 'armor'].includes(tankLevel))

      array.push(new BotGroupConfig({ tankLevel, count }))
    }
    return List(array)
      .setSize(4)
      .map(v => (v ? v : new BotGroupConfig()))
  }
}

export namespace StageConfigConverter {
  // stage-to-editor
  export function s2e(stage: StageConfig): EditorStageConfig {
    const items = new Array<MapItem>(FIELD_BLOCK_SIZE ** 2)
    items.fill(new MapItem())
    const { bricks, steels, snows, forests, rivers, eagle } = stage.map
    bricks.forEach((set, brickT) => {
      if (set) {
        const [brickRow, brickCol] = IndexHelper.getRowCol('brick', brickT)
        const t = Math.floor(brickRow / 4) * FIELD_BLOCK_SIZE + Math.floor(brickCol / 4)
        const hex = 0b0001 << (2 * (Math.floor(brickRow / 2) % 2) + (Math.floor(brickCol / 2) % 2))
        if (items[t].type === 'B') {
          items[t] = items[t].update('hex', or(hex))
        } else {
          items[t] = new MapItem({ type: 'B', hex })
        }
      }
    })
    steels.forEach((set, steelT) => {
      if (set) {
        const [steelRow, steelCol] = IndexHelper.getRowCol('steel', steelT)
        const t = Math.floor(steelRow / 2) * FIELD_BLOCK_SIZE + Math.floor(steelCol / 2)
        const hex = 0b0001 << (2 * (steelRow % 2) + (steelCol % 2))
        if (items[t].type === 'T') {
          items[t] = items[t].update('hex', or(hex))
        } else {
          items[t] = new MapItem({ type: 'T', hex })
        }
      }
    })
    rivers.forEach((set, t) => {
      if (set) items[t] = new MapItem({ type: 'R' })
    })
    forests.forEach((set, t) => {
      if (set) items[t] = new MapItem({ type: 'F' })
    })
    snows.forEach((set, t) => {
      if (set) items[t] = new MapItem({ type: 'S' })
    })

    if (eagle != null) {
      const { x, y } = eagle
      const row = Math.floor(y / BLOCK_SIZE)
      const col = Math.floor(x / BLOCK_SIZE)
      items[row * FIELD_BLOCK_SIZE + col] = new MapItem({ type: 'E' })
    }

    return {
      name: stage.name,
      custom: stage.custom,
      difficulty: stage.difficulty,
      itemList: List(items),
      bots: stage.bots,
    }
  }

  // stage-to-raw
  export function s2r(stage: StageConfig): RawStageConfig {
    return e2r(s2e(stage))
  }

  // editor-to-stage
  export function e2s(editorStageConfig: EditorStageConfig): StageConfig {
    const { name, custom, difficulty, itemList, bots } = editorStageConfig
    const map = StageConfig.parseStageMap(serializeMapItemList(itemList))
    return new StageConfig({ name, difficulty, custom, map, bots: bots })
  }

  // editor-to-raw
  export function e2r(editorStageConfig: EditorStageConfig): RawStageConfig {
    const { name, custom, bots, difficulty, itemList } = editorStageConfig
    return {
      name: name.toLowerCase(),
      custom,
      difficulty,
      map: serializeMapItemList(itemList),
      bots: bots
        .filter(e => e.count > 0)
        .map(e => `${e.count}*${e.tankLevel}`)
        .toArray(),
    }
  }

  // raw-to-stage
  export function r2s(raw: RawStageConfig): StageConfig {
    return StageConfig.fromRawStageConfig(raw)
  }

  // raw-to-editor
  export function r2e(raw: RawStageConfig): EditorStageConfig {
    return s2e(r2s(raw))
  }
}
