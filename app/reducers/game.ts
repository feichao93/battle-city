import { Map, Record, Repeat } from 'immutable'

const emptyTransientKillInfo = Map({
  'player-1': Map({
    basic: -1,
    fast: -1,
    power: -1,
    armor: -1,
  }),
  'player-2': Map({
    basic: -1,
    fast: -1,
    power: -1,
    armor: -1,
  }),
}) as Map<PlayerName, Map<TankLevel, KillCount>>

const defaultRemainingEnemies = Repeat('basic' as TankLevel, 20).toList()
type GameStatus = 'idle' | 'on' | 'stat' | 'gameover'

const GameRecordBase = Record(
  {
    /** 游戏状态 */
    status: 'idle' as GameStatus,
    /** 游戏是否暂停 */
    paused: false,
    /** 上次进行的关卡名 */
    lastStageName: null as string,
    /** 当前的关卡名 */
    currentStageName: null as string,
    /** 即将开始的关卡的名称 */
    comingStageName: null as string,
    /** 当前关卡剩余的敌人的类型列表 */
    remainingEnemies: defaultRemainingEnemies,
    /** 当前关卡的击杀信息 */
    killInfo: Map<PlayerName, Map<TankLevel, KillCount>>(),
    /** 当前关卡的击杀信息, 用于进行动画播放 */
    transientKillInfo: emptyTransientKillInfo,
    /** 关卡击杀信息动画, 是否显示total的数量 */
    showTotalKillCount: false,
    /** AI坦克的冻结时间. 小于等于0表示没有冻结, 大于0表示还需要一段时间解冻 */
    AIFrozenTimeout: 0,

    /** 是否显示HUD */
    showHUD: false,

    /** stage-enter-curtain相关字段 */
    stageEnterCurtainT: 0,
  },
  'GameRecord',
)

export class GameRecord extends GameRecordBase {}

export default function game(state = new GameRecord(), action: Action) {
  if (action.type === 'START_GAME') {
    return state.set('status', 'on').set('currentStageName', null)
  } else if (action.type === 'RESET_GAME') {
    return state.set('status', 'idle').set('currentStageName', null)
  } else if (action.type === 'SHOW_STATISTICS') {
    return state.set('status', 'stat')
  } else if (action.type === 'HIDE_STATISTICS') {
    return state.set('status', 'on')
  } else if (action.type === 'END_GAME') {
    return state
      .set('status', 'gameover')
      .set('lastStageName', state.currentStageName)
      .set('currentStageName', null)
  } else if (action.type === 'START_STAGE') {
    return state.merge({
      currentStageName: action.stage.name,
      transientKillInfo: emptyTransientKillInfo,
      killInfo: Map(),
      remainingEnemies: action.stage.enemies,
      showTotalKillCount: false,
    })
  } else if (action.type === 'END_STAGE') {
    return state.set('currentStageName', null)
  } else if (action.type === 'REMOVE_FIRST_REMAINING_ENEMY') {
    return state.update('remainingEnemies', enemies => enemies.shift())
  } else if (action.type === 'INC_KILL_COUNT') {
    const { playerName, level } = action
    return state.updateIn(['killInfo', playerName, level], x => (x == null ? 1 : x + 1))
  } else if (action.type === 'UPDATE_TRANSIENT_KILL_INFO') {
    return state.set('transientKillInfo', action.info)
  } else if (action.type === 'SHOW_TOTAL_KILL_COUNT') {
    return state.set('showTotalKillCount', true)
  } else if (action.type === 'SET_AI_FROZEN_TIMEOUT') {
    return state.set('AIFrozenTimeout', action.AIFrozenTimeout)
  } else if (action.type === 'GAMEPAUSE') {
    return state.set('paused', true)
  } else if (action.type === 'GAMERESUME') {
    return state.set('paused', false)
  } else if (action.type === 'UPDATE_CURTAIN') {
    return state.set('stageEnterCurtainT', action.t)
  } else if (action.type === 'SHOW_HUD') {
    return state.set('showHUD', true)
  } else if (action.type === 'HIDE_HUD') {
    return state.set('showHUD', false)
  } else if (action.type === 'UPDATE_COMING_STAGE_NAME') {
    return state.set('comingStageName', action.stageName)
  } else {
    return state
  }
}
