import { List } from 'immutable'
import React, { useEffect } from 'react'
import { match } from 'react-router'
import { Dispatch } from 'redux'
import { GameRecord } from '../reducers/game'
import { useRedux } from '../ReduxContext'
import StageConfig from '../types/StageConfig'
import * as actions from '../utils/actions'
import BattleFieldScene from './BattleFieldScene'
import StatisticsScene from './StatisticsScene'

export interface GameSceneProps {
  game: GameRecord
  stages: List<StageConfig>
  dispatch: Dispatch
  match: match<any>
}

export default function GameScene({ match }: GameSceneProps) {
  const [{ game, stages }, dispatch] = useRedux()

  useEffect(() => {
    if (game.status === 'idle' || game.status === 'gameover') {
      // 如果游戏还没开始或已经结束 则开始游戏
      const stageName = match.params.stageName
      const stageIndex = stages.findIndex(s => s.name === stageName)
      dispatch(actions.startGame(stageIndex === -1 ? 0 : stageIndex))
    } else {
      // status is 'on' or 'statistics'
      // 用户在地址栏中手动输入了新的关卡名称
      const stageName = match.params.stageName
      if (
        game.currentStageName != null &&
        stages.some(s => s.name === stageName) &&
        stageName !== game.currentStageName
      ) {
        DEV.LOG && console.log('`stageName` in url changed. Restart game...')
        dispatch(actions.startGame(stages.findIndex(s => s.name === stageName)))
      }
    }
  })
  useEffect(() => () => dispatch(actions.leaveGameScene()), [])

  if (game.status === 'stat') {
    return <StatisticsScene />
  } else {
    return <BattleFieldScene />
  }
}
