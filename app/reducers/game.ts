import { Map, Record, List } from 'immutable'
import parseStageEnemies from 'utils/parseStageEnemies'
import stageConfigs from 'stages'

type KillCount = number

export const GameRecord = Record({
  overlay: '' as Overlay,
  // 当前的关卡名
  currentStage: null as string,
  /** 当前关卡剩余的敌人的类型列表 */
  remainingEnemies: List<TankLevel>(),
  // 当前关卡的击杀信息  Map<playerName, Map<EnemyLevel, killCount>>
  killInfo: Map<PlayerName, Map<TankLevel, KillCount>>(),
}, 'GameRecord')

const gameRecord = GameRecord()

export type GameRecord = typeof gameRecord

export default function game(state = gameRecord, action: Action) {
  if (action.type === 'SHOW_OVERLAY') {
    return state.set('overlay', action.overlay)
  } else if (action.type === 'LOAD_STAGE') {
    return state.merge({
      currentStage: action.name,
      killInfo: Map(),
      remainingEnemies: parseStageEnemies(stageConfigs[action.name].enemies),
    })
  } else if (action.type === 'REMOVE_OVERLAY') {
    return state.set('overlay', null)
  } else if (action.type === 'REMOVE_FIRST_REMAINING_ENEMY') {
    return state.update('remainingEnemies', enemies => enemies.shift())
  } else if (action.type === 'INC_KILL_COUNT') {
    const { playerName, level } = action
    return state.updateIn(['killInfo', playerName, level], x => (x == null ? 1 : x + 1))
  } else {
    return state
  }
}
