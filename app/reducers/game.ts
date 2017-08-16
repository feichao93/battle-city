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
}, 'GameRecord')

const gameRecord = GameRecord()

export type GameRecord = typeof gameRecord

export default function game(state = gameRecord, action: Action) {
  if (action.type === 'LOAD_SCENE') {
    return state.set('scene', action.scene)
  } else if (action.type === 'LOAD_STAGE') {
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
  } else {
    return state
  }
}
