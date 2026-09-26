import type Bullet from '../entities/Bullet'
import type { Pilot } from '../GameSession'
import type PowerUp from '../entities/PowerUp'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import type { CollisionWorld } from '../physics/collision'
import type { Input } from '../types'
import type { Spot } from './spots'

/** AI 决策所需的世界上下文，BattleScene 每个 tick 组装一次 */
export interface AIContext {
  world: CollisionWorld
  map: TerrainMap
  tanks: Tank[]
  bullets: Bullet[]
  powerUps: PowerUp[]
  spots: Spot[]
  random: () => number
  /** 本关逻辑时间（ms），即 scene.time */
  time: number
  stageNumber: number
  /** 按玩家下标；不在场为 null */
  players: (Tank | null)[]
  /** 按玩家下标，谁在驾驶 */
  pilots: Pilot[]
}

/** 驾驶者在某个 tick 的操作，快照里记下来便于调试 */
export interface TankIntent {
  move: Input | null
  fire: boolean
}

/**
 * 坦克的驾驶者：键盘、BotBrain、TeammateBrain。BattleScene 每个 tick 依次调用
 * move → 结算移动 → fire，开火判断因此能看到本 tick 移动后的朝向和位置
 */
export interface TankController {
  /** 本 tick 的移动意图；null 表示松开方向键 */
  move(tank: Tank, ctx: AIContext, delta: number): Input | null
  /** 本 tick 是否按着开火键 */
  fire(tank: Tank, ctx: AIContext, delta: number): boolean
}
