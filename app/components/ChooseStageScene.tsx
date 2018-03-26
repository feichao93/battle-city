import React from 'react'
import { connect, Dispatch } from 'react-redux'
import { match, Redirect } from 'react-router-dom'
import { replace } from 'react-router-redux'
import Text from 'components/Text'
import { stageNames } from 'stages'
import TextButton from 'components/TextButton'
import { BLOCK_SIZE as B, CONTROL_CONFIG } from 'utils/constants'
import { State } from 'types'
import StagePreview from './StagePreview'

class ChooseStageScene extends React.PureComponent<{
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
    const { match } = this.props
    const { stageName } = match.params
    const stageIndex = stageNames.indexOf(stageName)
    DEV.ASSERT && console.assert(stageIndex !== -1)
    return stageIndex
  }

  onChoose = (stageName: string) => this.props.dispatch(replace(`/choose-stage/${stageName}`))

  onChoosePrevStage = () => {
    const stageIndex = this.getCurrentStageIndex()
    if (stageIndex > 0) {
      this.onChoose(stageNames[stageIndex - 1])
    }
  }

  onChooseNextStage = () => {
    const stageIndex = this.getCurrentStageIndex()
    if (stageIndex < stageNames.length - 1) {
      this.onChoose(stageNames[stageIndex + 1])
    }
  }

  onStartPlay = () => {
    this.props.dispatch<Action>({
      type: 'START_GAME',
      stageIndex: this.getCurrentStageIndex(),
    })
  }

  render() {
    const { match, dispatch } = this.props
    const { stageName } = match.params
    if (!stageNames.includes(stageName)) {
      return <Redirect to={`${match.url}/${stageNames[0]}`} />
    }
    const index = stageNames.indexOf(stageName)
    return (
      <g className="choose-stage-scene">
        <Text content="choose stage:" x={0.5 * B} y={0.5 * B} />
        <StagePreview stageName={stageNames[index - 1]} x={0.75 * B} y={3.375 * B} scale={1 / 4} />
        <StagePreview stageName={stageName} x={4.75 * B} y={1.75 * B} scale={1 / 2} />
        <StagePreview stageName={stageNames[index + 1]} x={12 * B} y={3.375 * B} scale={1 / 4} />
        <Text content={`stage ${stageName}`} x={6.5 * B} y={8.5 * B} />
        <g className="button-areas" transform={`translate(${2.5 * B}, ${11 * B})`}>
          <TextButton
            content="prev"
            textFill="white"
            disabled={index === 0}
            x={0}
            y={0}
            onClick={this.onChoosePrevStage}
          />
          <TextButton
            content="next"
            textFill="white"
            disabled={index === stageNames.length - 1}
            x={3 * B}
            y={0}
            onClick={this.onChooseNextStage}
          />
          <TextButton
            content="play"
            textFill="#96d332"
            stroke="#96d332"
            x={6 * B}
            y={0}
            onClick={this.onStartPlay}
          />
          <TextButton
            content="back"
            textFill="white"
            x={9 * B}
            y={0}
            onClick={() => dispatch(replace('/'))}
          />
        </g>
        <g className="hint" transform={`translate(${0.5 * B},${14 * B}) scale(0.5)`}>
          <Text fill="#ccc" content="This page is a little janky. Keep patient." x={0} y={0} />
        </g>
      </g>
    )
  }
}

export default connect(undefined)(ChooseStageScene)
