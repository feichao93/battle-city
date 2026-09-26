import type { TankColor, TankLevel } from './types'

/** n 帧对应的毫秒数；原版按 60fps 逐帧计时 */
export const frame = (n: number): number => (1000 / 60) * n

/** 一个 block 对应 16 像素 */
export const BLOCK_SIZE = 16
/** 坦克的大小 */
export const TANK_SIZE = BLOCK_SIZE
/** 战场的大小（13 block × 13 block） */
export const FIELD_BLOCK_SIZE = 13
/** 战场的大小（208px × 208px） */
export const FIELD_SIZE = BLOCK_SIZE * FIELD_BLOCK_SIZE
/** 子弹的大小 */
export const BULLET_SIZE = 3
/** 摧毁 steel 所需的最低子弹 power 值 */
export const STEEL_POWER = 3

/** 渲染缩放倍数 */
export const ZOOM_LEVEL = 2
/** 屏幕逻辑尺寸（含右侧 HUD 区，16×15 block） */
export const SCREEN_WIDTH = 16 * BLOCK_SIZE
export const SCREEN_HEIGHT = 15 * BLOCK_SIZE

/**
 * 坦克配色方案：黄 / 绿 / 银 / 红。
 * 每种方案 a 浅色、b 一般色、c 深色。
 */
export const TANK_COLOR_SCHEMES: Record<TankColor, { a: string; b: string; c: string }> = {
  yellow: { a: '#E7E794', b: '#E79C21', c: '#6B6B00' },
  green: { a: '#B5F7CE', b: '#008C31', c: '#005200' },
  silver: { a: '#FFFFFF', b: '#ADADAD', c: '#00424A' },
  red: { a: '#FFFFFF', b: '#B53121', c: '#5A007B' },
}

/** 击杀坦克得分 */
export const TANK_KILL_SCORE_MAP: Record<TankLevel, number> = {
  basic: 100,
  fast: 200,
  power: 300,
  armor: 400,
}

/** 各类地形子格的边长（像素） */
export const ITEM_SIZE_MAP = {
  BRICK: 4,
  STEEL: 8,
  RIVER: BLOCK_SIZE,
  SNOW: BLOCK_SIZE,
  FOREST: BLOCK_SIZE,
} as const

/** 各类地形铺满一整行所需的子格数量 */
export const N_MAP = {
  BRICK: FIELD_SIZE / ITEM_SIZE_MAP.BRICK, // 52
  STEEL: FIELD_SIZE / ITEM_SIZE_MAP.STEEL, // 26
  RIVER: FIELD_SIZE / ITEM_SIZE_MAP.RIVER, // 13
  SNOW: FIELD_SIZE / ITEM_SIZE_MAP.SNOW, // 13
  FOREST: FIELD_SIZE / ITEM_SIZE_MAP.FOREST, // 13
} as const

export const TANK_LEVELS: TankLevel[] = ['basic', 'fast', 'power', 'armor']

/** 玩家出生点 */
export const PLAYER_SPAWN_POS = {
  player1: { x: 4 * BLOCK_SIZE, y: 12 * BLOCK_SIZE },
  player2: { x: 8 * BLOCK_SIZE, y: 12 * BLOCK_SIZE },
} as const

/** 每累计 10000 分 +1 命 */
export const LIFE_BONUS_SCORE = 10000

/** bot 出生点（屏幕顶部三处，y 均为 0），按轮流顺序排列：中 → 右 → 左 */
export const BOT_SPAWN_X = [6 * BLOCK_SIZE, 12 * BLOCK_SIZE, 0] as const

/** 每关 20 个 bot 中携带道具的下标（从 0 计） */
export const POWER_UP_BOT_INDICES = [3, 10, 17]

/** 同时在场的 bot 上限（含正在出生、正在爆炸的） */
export const MAX_BOT_ON_FIELD = { single: 4, multi: 6 }

/** bot 出生间隔（帧 → ms）：190 − 4 × 关卡号，双人再减 20；第 35 关之后按第 35 关算 */
export function botSpawnInterval(stageNumber: number, multi: boolean): number {
  return frame(190 - 4 * Math.min(stageNumber, 35) - (multi ? 20 : 0))
}

/** bot 出生闪烁的总时长（帧 → ms），与关卡无关 */
export const BOT_FLICKER_DURATION = frame(56)

/** 击杀分数弹出的显示时长（帧 → ms） */
export const SCORE_POPUP_DURATION = frame(48)

/** 击杀坦克得分 */
export const POWER_UP_SCORE = 500

/** 玩家初始命数 */
export const INITIAL_LIVES = 3

/** 玩家复活无敌头盔时长（帧 → ms） */
export const SPAWN_HELMET_DURATION = frame(135)

/** 玩家托管：每关开战后一直没按键时，可操作满 START 就托管；按过键之后连续空闲 IDLE 托管（ms） */
export const AUTOPILOT_START = 2000
export const AUTOPILOT_IDLE = 5000

/** AI 判定「卡住」的超时（ms）与位移阈值 */
export const BLOCK_TIMEOUT = 200
export const BLOCK_DISTANCE_THRESHOLD = 0.01

/** armor 坦克拾取 star 的额外得分 */
export const STAR_ARMOR_SCORE = 5000
/** timer 道具：冻结计数与每次递减的间隔（帧 → ms）；计数按全局时钟的 64 帧边界递减，实际时长 576～640 帧 */
export const TIMER_FREEZE_TICKS = 10
export const TIMER_FREEZE_TICK = frame(64)
/**
 * 冰面（雪地）滑行，只作用于玩家坦克：在冰上从静止按下方向键时剩余滑行量置为 START（px），
 * 大于 LOCK 期间忽略方向键、沿朝向继续走；松开后滑完剩余量。
 * NES 是滑 28、剩余 ≥ 16 时锁定，试玩觉得太滑，减到约一个坦克长
 */
export const SNOW_SLIDE_START = 16
export const SNOW_SLIDE_LOCK = 8
/** helmet 道具的无敌时长（帧 → ms） */
export const HELMET_POWERUP_DURATION = frame(630)
/** shovel：变钢持续（帧 → ms）、闪烁间隔、闪烁次数 */
export const SHOVEL_STEEL_DURATION = frame(1076)
export const SHOVEL_BLINK_INTERVAL = frame(16)
export const SHOVEL_BLINK_TIMES = 6
