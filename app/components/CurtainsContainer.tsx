import React from 'react'
import { connect } from 'react-redux'
import { State } from '../types'
import StageEnterCurtain from './StageEnterCurtain'

interface P {
  stageEnterCurtainT: number
  comingStageName: string
}

class CurtainsContainer extends React.PureComponent<P> {
  render() {
    const { stageEnterCurtainT: t, comingStageName } = this.props
    return <StageEnterCurtain content={`stage  ${comingStageName}`} t={t} />
  }
}

function mapStateToProps(state: State) {
  return {
    stageEnterCurtainT: state.game.stageEnterCurtainT,
    comingStageName: state.game.comingStageName,
  }
}

export default connect(mapStateToProps)(CurtainsContainer)
