import { List } from 'immutable'
import React from 'react'
import { connect } from 'react-redux'
import { match } from 'react-router'
import { Dispatch } from 'redux'
import { GameRecord } from '../reducers/game'
import { State } from '../types'
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

class GameScene extends React.PureComponent<GameSceneProps> {
  componentDidMount() {
    this.didMountOrUpdate()
  }

  componentDidUpdate() {
    this.didMountOrUpdate()
  }

  didMountOrUpdate() {
    const { game, dispatch, match, stages } = this.props
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
  }

  componentWillUnmount() {
    this.props.dispatch(actions.leaveGameScene())
  }

  render() {
    const { game } = this.props
    if (game.status === 'stat') {
      return <StatisticsScene />
    } else {
      return <BattleFieldScene />
    }
  }
}

function mapStateToProps(state: State) {
  return { game: state.game, stages: state.stages }
}

export default connect(mapStateToProps)(GameScene) as any
