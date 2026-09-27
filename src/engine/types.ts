export type Direction = 'up' | 'down' | 'left' | 'right'

export type TankLevel = 'basic' | 'fast' | 'power' | 'armor'

export type TankColor = 'yellow' | 'green' | 'silver' | 'red'

export type TankSide = 'player' | 'bot'

/** 地图 block 的类型：空 / 老鹰 / 砖 / 钢 / 河 / 雪 / 森林 */
export type MapItemType = 'X' | 'E' | 'B' | 'T' | 'R' | 'S' | 'F'

export interface Point {
  x: number
  y: number
}

/** 一个 tick 内坦克的移动意图：转向 / 前进（可限制最大距离）/ 无（null 表示停止） */
export type Input =
  | { type: 'turn'; direction: Direction }
  | { type: 'forward'; maxDistance?: number }

/** 爆炸形状：s* 为小爆炸（子弹命中），b* 为大爆炸（坦克/道具） */
export type ExplosionShape = 's0' | 's1' | 's2' | 'b0' | 'b1'

/** 6 种道具 */
export type PowerUpName = 'tank' | 'star' | 'grenade' | 'timer' | 'helmet' | 'shovel'

/** 引擎向外播放音效的端口（由 AudioManager 实现，引擎不依赖具体实现） */
export interface AudioPort {
  play(name: SoundName): void
}

/** 音效名（对应 src/audio/sounds/*.ogg） */
export type SoundName =
  | 'stage_start'
  | 'game_over'
  | 'bullet_shot'
  | 'bullet_hit_1'
  | 'bullet_hit_2'
  | 'explosion_1'
  | 'explosion_2'
  | 'pause'
  | 'powerup_appear'
  | 'powerup_pick'
  | 'statistics_1'
  // 冰面起滑音效，资源文件尚未补充，缺失时 AudioManager 静默跳过
  | 'snow_slide'

/** 关卡敌人配置，例如 18*basic */
export interface BotGroupConfig {
  tankLevel: TankLevel
  count: number
}

/** 关卡 JSON 的原始格式 */
export interface RawStageConfig {
  name: string
  custom?: boolean
  difficulty: 1 | 2 | 3 | 4
  map: string[]
  bots: string[]
}
