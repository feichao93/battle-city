import type { Direction } from '../types'
import type { LaneHitKind } from './lane'

/** 决策模型的 choice 选项：move_* 开动，face_* 原地转向瞄准；每次只给局面下有意义的那些（见 prompt.ts） */
export const ACTIONS = [
  'move_up',
  'move_down',
  'move_left',
  'move_right',
  'face_up',
  'face_down',
  'face_left',
  'face_right',
  'stay',
] as const
export type Action = (typeof ACTIONS)[number]

/** 决策从发出到生效的大致耗时（往返约 180ms + 一个 tick），估算来不来得及躲 */
export const REACTION_MS = 200
/** 正对着我的 bot 马上能开火、子弹这么快就到，算危险 */
export const FACING_DANGER_ETA = 700
/** bot 还没朝着我时要转一下才开火，只有很近才算危险 */
export const SIDE_DANGER_ETA = 300

/** 站在某个位置时，这条射线算不算危险：bot 在决策生效前就能开火，子弹又来得快 */
export function hotRay(readyIn: number | null, facing: boolean, eta: number): boolean {
  if (readyIn == null || readyIn > REACTION_MS) return false
  return eta <= (facing ? FACING_DANGER_ETA : SIDE_DANGER_ETA)
}

export const INTENTS = ['attack', 'defend_eagle', 'dodge', 'get_powerup', 'dig'] as const
export type Intent = (typeof INTENTS)[number]

export interface ChoiceAnswer<T extends string> {
  type: 'choice'
  choice: T
  confidence: number
  /** 只含本次给出的选项 */
  probabilities: Partial<Record<T, number>>
}

export interface NoulAnswer {
  type: 'noul'
  /** P(yes) */
  noul: number
}

/** 发给接口的 state 与 questions */
export interface DecisionPrompt {
  /** 局面的中文描述；模型读 JSON 的能力很弱，读中文描述几乎不出错 */
  text: string
  questions: Record<keyof DecisionAnswers, DecisionQuestion>
}

export type DecisionQuestion =
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'noul'; instructions: string }

/** 每个方向单独问一次开火：转向和开火能在同一次决策里完成 */
export type FireKey = `fire_${Direction}`

/** 对应接口返回体的 answers，key 与 DecisionPrompt.questions 一致 */
export type DecisionAnswers = {
  action: ChoiceAnswer<Action>
  intent: ChoiceAnswer<Intent>
} & Record<FireKey, NoulAnswer>

export interface DecisionRequest {
  /** 玩家下标 */
  player: number
  /** 发出请求时的本关逻辑时间（ms） */
  time: number
  /** 结构化的局面，面板展示用 */
  state: DecisionState
  prompt: DecisionPrompt
}

/** 向决策模型要一次决策；引擎不碰网络，由 UI 注入实现 */
export type DecisionClient = (request: DecisionRequest) => Promise<DecisionAnswers>

export type Blocker = 'free' | 'brick' | 'steel' | 'river' | 'tank' | 'eagle' | 'edge'

/** 局面的结构化特征，prompt.ts 据此写成中文描述。坐标都是 8px 一格，坦克占 2×2；dx/dy 相对自己 */
export interface DecisionState {
  /** 26×26 地图，只给面板看，不发给模型 */
  map: string[]
  me: {
    col: number
    row: number
    facing: Direction
    helmet: boolean
    /** 0–3，吃星星升级 */
    stars: number
    bulletsInFlight: number
  }
  moves: Record<Direction, Blocker>
  /** 往各方向走一步（8px）后，哪些 bot（bots 的下标）和我之间没有遮挡、开火就能打到我；eta 是子弹飞过来的毫秒数 */
  exposure: Record<Direction, { bot: number; facing: boolean; eta: number }[]>
  /** 往各方向走一步后，再往哪些方向走一步能到达没有危险射线的位置（见 hotRay）；走不了为空 */
  exits: Record<Direction, Direction[]>
  lanes: Record<Direction, { hit: LaneHitKind; distance: number; bricks: number }>
  /**
   * 会打中自己的 bot 子弹，按到达先后排序；eta 是毫秒。dodge：往这个方向要开 ms 毫秒才能让出弹道，
   * inTime 按决策延迟估算来不来得及；counter：朝来弹方向开火能迎面抵消它
   */
  incoming: {
    from: Direction
    eta: number
    dodge: { direction: Direction; ms: number; inTime: boolean }[]
    counter: boolean
  }[]
  /** 朝各方向开动撞上砖墙时，大约要打几枪才能开过去；不是砖为 0 */
  digShots: Record<Direction, number>
  bots: {
    dx: number
    dy: number
    level: string
    facing: Direction
    hp: number
    aimingAtMe: boolean
    /** 离能开火还有多少毫秒；它的子弹还在飞（打中东西前不能再开）为 null */
    readyIn: number | null
    /**
     * 它朝 direction 开火能打到我（facing：已经朝着了）；bricks 是中间要打穿的砖（4px 一层），
     * eta 是子弹从出膛到打中我的毫秒数
     */
    threat: { direction: Direction; facing: boolean; bricks: number; eta: number } | null
    /** 我转向朝 direction 开火能打到它；错开半格时常常它打得到我、我打不到它 */
    shot: { direction: Direction; bricks: number } | null
    /** 炮口前第一个挡子弹的是老鹰（或老鹰外墙） */
    aimingAtEagle: boolean
    distToEagle: number | null
  }[]
  eagle: { dx: number; dy: number; broken: boolean } | null
  teammate: { dx: number; dy: number; pilot: string } | null
  powerUps: { type: string; dx: number; dy: number }[]
  /** 最近几次决策选的 action，从早到晚 */
  recentActions: Action[]
  remainingBots: number
  /** 策略一用：不经加工的原始局面，见 prompt-raw.ts */
  raw: RawState
}

/** 坐标 col/row = 像素 / 8，保留一位小数，都是左上角 */
export interface RawState {
  /** 26 行地形，老鹰画成 E，不含坦克、子弹、道具 */
  terrain: string[]
  me: { col: number; row: number; direction: Direction; level: string; helmet: boolean }
  bots: { col: number; row: number; direction: Direction; level: string; hp: number }[]
  bullets: { col: number; row: number; direction: Direction; owner: 'me' | 'bot' | 'teammate' }[]
  teammate: { col: number; row: number; direction: Direction } | null
  powerUps: { type: string; col: number; row: number }[]
  eagle: { col: number; row: number; broken: boolean } | null
}
