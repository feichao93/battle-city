import * as React from 'react'
import { connect } from 'react-redux'
import { State } from 'types'
import StageEnterCurtain from 'components/StageEnterCurtain'

interface P {
  stageEnterCurtainT: number
}

class CurtainsContainer extends React.PureComponent<P> {
  render() {
    const { stageEnterCurtainT: t } = this.props
    return <StageEnterCurtain stageName="stage  1" t={t} />
  }
}

function mapStateToProps(state: State) {
  return {
    stageEnterCurtainT: state.game.stageEnterCurtainT,
  }
}

export default connect(mapStateToProps)(CurtainsContainer)
