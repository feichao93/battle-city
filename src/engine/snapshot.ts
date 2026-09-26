import type { TankIntent } from './ai/controller'
import type { LoseReason, StageStatus } from './BattleScene'
import { ITEM_SIZE_MAP, N_MAP } from './constants'
import type Bullet from './entities/Bullet'
import type PowerUp from './entities/PowerUp'
import type Tank from './entities/Tank'
import type { Pilot, SessionPhase } from './GameSession'
import type TerrainMap from './map/TerrainMap'
import type { Direction, PowerUpName, TankColor, TankLevel, TankSide } from './types'

/**
 * 对局状态的纯数据快照：可以直接 JSON 序列化，不含实体类和函数，测试断言和调试用。
 * 数值保留 3 位小数，同一局同一时刻的快照逐字节一致
 */
export interface SessionSnapshot {
  phase: SessionPhase
  phaseTime: number
  stageIndex: number
  stageName: string
  cleared: boolean
  aiOnly: boolean
  stageEndAutopilot: boolean[] | null
  players: PlayerSnapshot[]
  /** 首关地图载入之前为 null */
  scene: SceneSnapshot | null
}

export interface PlayerSnapshot {
  lives: number
  score: number
  pilot: Pilot
  idleTime: number
  reservedTankLevel: TankLevel | null
}

export interface SceneSnapshot {
  time: number
  status: StageStatus
  loseReason: LoseReason | null
  /** 还没开始出生的 bot 数 */
  remainingBots: number
  /** timer 道具生效中 */
  botsFrozen: boolean
  terrain: string[]
  eagle: { x: number; y: number; broken: boolean } | null
  /** 按玩家下标 */
  slots: SlotSnapshot[]
  tanks: TankSnapshot[]
  /** 正在出生闪烁的坦克 */
  spawning: { side: TankSide; x: number; y: number }[]
  bullets: BulletSnapshot[]
  powerUps: { name: PowerUpName; x: number; y: number }[]
}

export interface SlotSnapshot {
  /** 在场坦克的 id；不在场时为 null */
  tankId: number | null
  state: 'alive' | 'spawning' | 'respawning' | 'out'
}

export interface TankSnapshot {
  id: number
  side: TankSide
  level: TankLevel
  color: TankColor
  x: number
  y: number
  direction: Direction
  hp: number
  helmet: number
  frozen: number
  slide: number
  withPowerUp: boolean
  /** 本 tick 驾驶者的操作；timer 冻结中的 bot 为 null */
  intent: TankIntent | null
}

export interface BulletSnapshot {
  id: number
  side: TankSide
  tankId: number
  x: number
  y: number
  direction: Direction
}

export const round = (v: number): number => Math.round(v * 1000) / 1000

/**
 * 地形按砖的精度（4px）画成 52 行字符：# 砖，@ 钢，~ 河，: 雪，% 森林，. 空地。
 * 每个 4px 格只会是一种地形，所以不丢信息
 */
export function terrainSnapshot(map: TerrainMap): string[] {
  const n = N_MAP.BRICK
  const size = ITEM_SIZE_MAP.BRICK
  const rows: string[] = []
  for (let row = 0; row < n; row += 1) {
    let line = ''
    for (let col = 0; col < n; col += 1) {
      const px = col * size
      const py = row * size
      const at = (cells: boolean[], cellSize: number, cellN: number) =>
        cells[Math.floor(py / cellSize) * cellN + Math.floor(px / cellSize)]
      if (map.bricks[row * n + col]) line += '#'
      else if (at(map.steels, ITEM_SIZE_MAP.STEEL, N_MAP.STEEL)) line += '@'
      else if (at(map.rivers, ITEM_SIZE_MAP.RIVER, N_MAP.RIVER)) line += '~'
      else if (at(map.snows, ITEM_SIZE_MAP.SNOW, N_MAP.SNOW)) line += ':'
      else if (at(map.forests, ITEM_SIZE_MAP.FOREST, N_MAP.FOREST)) line += '%'
      else line += '.'
    }
    rows.push(line)
  }
  return rows
}

export function tankSnapshot(tank: Tank, intent: TankIntent | null): TankSnapshot {
  return {
    id: tank.tankId,
    side: tank.side,
    level: tank.level,
    color: tank.color,
    x: round(tank.x),
    y: round(tank.y),
    direction: tank.direction,
    hp: tank.hp,
    helmet: round(tank.helmetDuration),
    frozen: round(tank.frozenTimeout),
    slide: round(tank.slide),
    withPowerUp: tank.withPowerUp,
    intent,
  }
}

export function bulletSnapshot(bullet: Bullet): BulletSnapshot {
  return {
    id: bullet.bulletId,
    side: bullet.side,
    tankId: bullet.tankId,
    x: round(bullet.x),
    y: round(bullet.y),
    direction: bullet.direction,
  }
}

export function powerUpSnapshot(powerUp: PowerUp): SceneSnapshot['powerUps'][number] {
  return { name: powerUp.name, x: round(powerUp.x), y: round(powerUp.y) }
}
