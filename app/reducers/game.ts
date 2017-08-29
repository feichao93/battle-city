import { Map, Record, Repeat } from 'immutable'
import parseStageEnemies from 'utils/parseStageEnemies'
import stageConfigs from 'stages'

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

export const GameRecord = Record({
  /** 游戏是否暂停 */
  paused: false,
  /** 当前场景 */
  scene: 'game-title' as Scene,
  /** 当前的关卡名 */
  currentStage: null as string,
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

  /** stage-enter-curtain相关字段 TODO 这个字段需要移动到其他的reducer中 */
  stageEnterCurtainT: 0,
}, 'GameRecord')

const gameRecord = GameRecord()

export type GameRecord = typeof gameRecord

export default function game(state = gameRecord, action: Action) {
  if (action.type === 'LOAD_SCENE') {
    return state.set('scene', action.scene)
  } else if (action.type === 'START_STAGE') {
    return state.merge({
      currentStage: action.name,
      transientKillInfo: emptyTransientKillInfo,
      killInfo: Map(),
      remainingEnemies: parseStageEnemies(stageConfigs[action.name].enemies),
      showTotalKillCount: false,
    })
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
  } else {
    return state
  }
}
