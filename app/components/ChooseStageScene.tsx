import { List } from 'immutable'
import React from 'react'
import { connect } from 'react-redux'
import { match, Redirect } from 'react-router-dom'
import { push, replace } from 'react-router-redux'
import { Dispatch } from 'redux'
import { StageConfig, State } from '../types'
import { BLOCK_SIZE as B, PLAYER_CONFIGS } from '../utils/constants'
import Screen from './Screen'
import StagePreview from './StagePreview'
import Text from './Text'
import TextButton from './TextButton'

class ChooseStageScene extends React.PureComponent<{
  stages: List<StageConfig>
  dispatch: Dispatch
  location: Location
  match: match<{ stageName: string }>
}> {
  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = (event: KeyboardEvent) => {
    const config = PLAYER_CONFIGS.player1
    if (event.code === config.control.left) {
      this.onChoosePrevStage()
    } else if (event.code === config.control.right) {
      this.onChooseNextStage()
    } else if (event.code === config.control.fire) {
      this.onStartPlay()
    }
  }

  getCurrentStageIndex = () => {
    const { stages, match } = this.props
    const { stageName } = match.params
    const stageIndex = stages.findIndex(s => s.name === stageName)
    DEV.ASSERT && console.assert(stageIndex !== -1)
    return stageIndex
  }

  onChoose = (stageName: string) => {
    const { dispatch, location } = this.props
    dispatch(replace(`/choose/${stageName}${location.search}`))
  }

  onChoosePrevStage = () => {
    const { stages } = this.props
    const stageIndex = this.getCurrentStageIndex()
    if (stageIndex > 0) {
      this.onChoose(stages.get(stageIndex - 1).name)
    }
  }

  onChooseNextStage = () => {
    const { stages } = this.props
    const stageIndex = this.getCurrentStageIndex()
    if (stageIndex < stages.size - 1) {
      this.onChoose(stages.get(stageIndex + 1).name)
    }
  }

  onStartPlay = () => {
    const { dispatch, match, location } = this.props
    const { stageName } = match.params
    dispatch(push(`/stage/${stageName}${location.search}`))
  }

  render() {
    const { match, dispatch, stages } = this.props
    const stageNames = stages.map(s => s.name)
    const { stageName } = match.params
    if (!stageNames.includes(stageName)) {
      return <Redirect to={`${match.url}/${stageNames.first()}`} />
    }
    const index = stageNames.indexOf(stageName)
    return (
      <Screen background="#333">
        <Text content="choose stage:" x={0.5 * B} y={0.5 * B} />
        <StagePreview
          key={index - 1}
          stage={index === 0 ? null : stages.get(index - 1)}
          x={0.75 * B}
          y={4.375 * B}
          scale={1 / 4}
        />
        <StagePreview
          key={index}
          stage={stages.get(index)}
          x={4.75 * B}
          y={2.75 * B}
          scale={1 / 2}
        />
        <StagePreview
          key={index + 1}
          stage={stages.get(index + 1)}
          x={12 * B}
          y={4.375 * B}
          scale={1 / 4}
        />
        <Text content={`stage ${stageName}`} x={6.5 * B} y={9.75 * B} />
        <g className="button-areas" transform={`translate(${2.5 * B}, ${12 * B})`}>
          <TextButton
            content="prev"
            disabled={index === 0}
            x={0}
            y={0}
            onClick={this.onChoosePrevStage}
          />
          <TextButton
            content="next"
            disabled={index === stageNames.size - 1}
            x={3 * B}
            y={0}
            onClick={this.onChooseNextStage}
          />
          <TextButton content="play" stroke="#96d332" x={6 * B} y={0} onClick={this.onStartPlay} />
          <TextButton content="back" x={9 * B} y={0} onClick={() => dispatch(replace('/'))} />
        </g>
        <g className="hint" transform={`translate(${0.5 * B},${14.5 * B}) scale(0.5)`}>
          <Text fill="#999" content="Press left or right to choose stages. Press fire to start." />
        </g>
      </Screen>
    )
  }
}

const mapStateToProps = (state: State) => ({ stages: state.stages })

export default connect(mapStateToProps)(ChooseStageScene)
