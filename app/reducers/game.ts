import { Map, Record, Repeat } from 'immutable'
import { BotGroupConfig } from '../types/StageConfig'
import { A, Action } from '../utils/actions'
import { inc } from '../utils/common'

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
}) as Map<PlayerName, Map<TankLevel, number>>

const defaultRemainingBots = Repeat('basic' as TankLevel, 20).toList()
const defaultPlayerScores = Map<PlayerName, number>([['player-1', 0], ['player-2', 0]])

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
    remainingBots: defaultRemainingBots,
    /** 当前关卡的击杀信息 */
    killInfo: Map<PlayerName, Map<TankLevel, number>>(),
    /** 玩家的得分信息 */
    playersScores: defaultPlayerScores,
    /** 当前关卡的击杀信息, 用于进行动画播放 */
    transientKillInfo: emptyTransientKillInfo,
    /** 关卡击杀信息动画, 是否显示total的数量 */
    showTotalKillCount: false,
    /** AI坦克的冻结时间. 小于等于0表示没有冻结, 大于0表示还需要一段时间解冻 */
    botFrozenTimeout: 0,
    /** 战场中是否正在生成 bot tank */
    isSpawningBotTank: false,

    /** 是否显示HUD */
    showHUD: false,

    /** stage-enter-curtain相关字段 */
    stageEnterCurtainT: 0,
  },
  'GameRecord',
)

// TODO 需要重构 game-record 的结构
export class GameRecord extends GameRecordBase {}

export default function game(state = new GameRecord(), action: Action) {
  if (action.type === A.StartGame) {
    return state
      .set('status', 'on')
      .set('currentStageName', null)
      .set('playersScores', defaultPlayerScores)
  } else if (action.type === A.ResetGame) {
    return state.set('status', 'idle').set('currentStageName', null)
  } else if (action.type === A.ShowStatistics) {
    return state.set('status', 'stat')
  } else if (action.type === A.HideStatistics) {
    return state.set('status', 'on')
  } else if (action.type === A.EndGame) {
    return state
      .set('status', 'gameover')
      .set('lastStageName', state.currentStageName)
      .set('currentStageName', null)
      .set('playersScores', defaultPlayerScores)
  } else if (action.type === A.StartStage) {
    return state.merge({
      currentStageName: action.stage.name,
      transientKillInfo: emptyTransientKillInfo,
      killInfo: Map(),
      remainingBots: action.stage.bots.flatMap(BotGroupConfig.unwind),
      showTotalKillCount: false,
    })
  } else if (action.type === A.EndStage) {
    return state.set('currentStageName', null)
  } else if (action.type === A.RemoveFirstRemainingBot) {
    return state.update('remainingBots', bots => bots.shift())
  } else if (action.type === A.IncKillCount) {
    const { playerName, level } = action
    return state.updateIn(['killInfo', playerName, level], x => (x == null ? 1 : x + 1))
  } else if (action.type === A.UpdateTransientKillInfo) {
    return state.set('transientKillInfo', action.info)
  } else if (action.type === A.ShowTotalKillCount) {
    return state.set('showTotalKillCount', true)
  } else if (action.type === A.SetBotFrozenTimeout) {
    return state.set('botFrozenTimeout', action.timeout)
  } else if (action.type === A.GamePause) {
    return state.set('paused', true)
  } else if (action.type === A.GameResume) {
    return state.set('paused', false)
  } else if (action.type === A.UpdateCurtain) {
    return state.set('stageEnterCurtainT', action.t)
  } else if (action.type === A.ShowHud) {
    return state.set('showHUD', true)
  } else if (action.type === A.HideHud) {
    return state.set('showHUD', false)
  } else if (action.type === A.UpdateComingStageName) {
    return state.set('comingStageName', action.stageName)
  } else if (action.type === A.IncPlayerScore) {
    return state.update('playersScores', scores =>
      scores.update(action.playerName, inc(action.count)),
    )
  } else if (action.type === A.SetIsSpawningBotTank) {
    return state.set('isSpawningBotTank', action.isSpawning)
  } else {
    return state
  }
}
