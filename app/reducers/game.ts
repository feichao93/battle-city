import { Map, Record } from 'immutable'

type KillCount = number

const defaultRemainingEnemyCount = 20

export const GameRecord = Record({
  overlay: '' as Overlay,
  // 当前的关卡名
  currentStage: null as string,
  // 当前关卡剩余的enemy数量
  remainingEnemyCount: defaultRemainingEnemyCount,
  // 当前活跃的enemy的数量
  activeEnemyCount: 0,
  // 当前关卡的击杀信息  Map<playerName, Map<EnemyLevel, killCount>>
  killInfo: Map<PlayerName, Map<TankLevel, KillCount>>(),
}, 'GameRecord')

const record = GameRecord()

export type GameRecord = typeof record

const inc = (x: number) => x + 1
const dec = (x: number) => x - 1

export default function game(state = record, action: Action) {
  if (action.type === 'SHOW_OVERLAY') {
    return state.set('overlay', action.overlay)
  } else if (action.type === 'LOAD_STAGE') {
    return state.set('currentStage', action.name)
      .set('remainingEnemyCount', defaultRemainingEnemyCount)
  } else if (action.type === 'REMOVE_OVERLAY') {
    return state.set('overlay', null)
  } else if (action.type === 'DECREMENT_REMAINING_ENEMY_COUNT') {
    return state.update('remainingEnemyCount', dec)
  } else if (action.type === 'KILL') {
    const { sourcePlayer, targetPlayer, targetTank } = action
    if (sourcePlayer.playerName.startsWith('player')) {
      const nextState = state.update('killInfo', killInfo => killInfo.update(
        // todo 目前暂时只用basic
        sourcePlayer.playerName, Map(), m => m.update('basic', 0, inc)))
      console.log(nextState)
      return nextState
    } else {
      return state
    }
  } else {
    return state
  }
}
