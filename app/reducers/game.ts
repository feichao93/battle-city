import { Map, Record } from 'immutable'

type KillCount = number

const defaultRemainingEnemyCount = 20

export const GameRecord = Record({
  overlay: '' as Overlay,
  // 当前的关卡名
  currentStage: null as string,
  // 当前关卡剩余的enemy数量
  remainingEnemyCount: defaultRemainingEnemyCount,
  // 当前关卡的击杀信息  Map<playerName, Map<EnemyLevel, killCount>>
  killInfo: Map<PlayerName, Map<TankLevel, KillCount>>(),
}, 'GameRecord')

const gameRecord = GameRecord()

export type GameRecord = typeof gameRecord

const inc = (x: number) => x + 1
const dec = (x: number) => x - 1

export default function game(state = gameRecord, action: Action) {
  if (action.type === 'SHOW_OVERLAY') {
    return state.set('overlay', action.overlay)
  } else if (action.type === 'LOAD_STAGE') {
    return state.set('currentStage', action.name)
      .set('remainingEnemyCount', defaultRemainingEnemyCount)
      .set('killInfo', Map())
  } else if (action.type === 'REMOVE_OVERLAY') {
    return state.set('overlay', null)
  } else if (action.type === 'DECREMENT_REMAINING_ENEMY_COUNT') {
    return state.update('remainingEnemyCount', dec)
  } else if (action.type === 'INC_KILL_COUNT') {
    const { playerName, level } = action
    return state.updateIn(['killInfo', playerName, level], x => (x == null ? 1 : x + 1))
  } else {
    return state
  }
}
