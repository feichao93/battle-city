import { List } from 'immutable'
import React from 'react'
import { connect, Dispatch } from 'react-redux'
import { match, Redirect } from 'react-router-dom'
import { push, replace } from 'react-router-redux'
import { StageConfig, State } from '../types'
import { BLOCK_SIZE as B, CONTROL_CONFIG } from '../utils/constants'
import Screen from './Screen'
import StagePreview from './StagePreview'
import Text from './Text'
import TextButton from './TextButton'

class ChooseStageScene extends React.PureComponent<{
  stages: List<StageConfig>
  dispatch: Dispatch<State>
  match: match<{ stageName: string }>
}> {
  componentDidMount() {
    document.addEventListener('keypress', this.handleKeyPress)
  }

  componentWillUnmount() {
    document.removeEventListener('keypress', this.handleKeyPress)
  }

  handleKeyPress = (event: KeyboardEvent) => {
    const config = CONTROL_CONFIG.player1
    if (event.key === config.left) {
      this.onChoosePrevStage()
    } else if (event.key === config.right) {
      this.onChooseNextStage()
    } else if (event.key === config.fire) {
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

  onChoose = (stageName: string) => this.props.dispatch(replace(`/choose/${stageName}`))

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
    const { dispatch, match } = this.props
    const { stageName } = match.params
    dispatch(push(`/stage/${stageName}`))
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
