import React from 'react'
import { connect, Dispatch } from 'react-redux'
import Text from 'components/Text'
import { stageConfigs, stageNames } from 'stages'
import TextButton from 'components/TextButton'
import RiverLayer from 'components/RiverLayer'
import SteelLayer from 'components/SteelLayer'
import BrickLayer from 'components/BrickLayer'
import ForestLayer from 'components/ForestLayer'
import SnowLayer from 'components/SnowLayer'
import Eagle from 'components/Eagle'
import parseStageMap from 'utils/parseStageMap'
import { BLOCK_SIZE as B } from 'utils/constants'
import { State } from 'types'

interface StagePreviewProps {
  stageName: string
  x: number
  y: number
  scale: number
}

class StagePreview extends React.PureComponent<StagePreviewProps> {
  render() {
    const { x, y, scale, stageName } = this.props
    if (stageConfigs[stageName] == null) {
      return (
        <g className="stage-preview empty" transform={`translate(${x}, ${y}) scale(${scale})`}>
          <rect width={13 * B} height={13 * B} fill="#000000" />
        </g>
      )
    }
    const map = parseStageMap(stageConfigs[stageName].map)
    const { rivers, steels, bricks, snows, eagle, forests } = map
    return (
      <g className="stage-preview" transform={`translate(${x}, ${y}) scale(${scale})`}>
        <rect width={13 * B} height={13 * B} fill="#000000" />
        <RiverLayer rivers={rivers} />
        <SteelLayer steels={steels} />
        <BrickLayer bricks={bricks} />
        <SnowLayer snows={snows} />
        {eagle ? <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} /> : null}
        <ForestLayer forests={forests} />
      </g>
    )
  }
}

class ChooseStageScene extends React.PureComponent<
  { dispatch: Dispatch<State> },
  { index: number }
> {
  state = {
    index: 0,
  }

  onChoosePrev = () => this.setState({ index: this.state.index - 1 })
  onChooseNext = () => this.setState({ index: this.state.index + 1 })
  onStartPlay = () => {
    this.props.dispatch<Action>({
      type: 'GAMESTART',
      stageIndex: this.state.index,
    })
  }

  render() {
    const { index } = this.state
    const current = stageNames[index]
    const prev = stageNames[index - 1]
    const next = stageNames[index + 1]

    return (
      <g className="choose-stage-scene">
        <Text content="choose stage:" x={0.5 * B} y={0.5 * B} />
        <StagePreview key={prev} stageName={prev} x={0.75 * B} y={3.375 * B} scale={1 / 4} />
        <StagePreview key={current} stageName={current} x={4.75 * B} y={1.75 * B} scale={1 / 2} />
        <StagePreview key={next} stageName={next} x={12 * B} y={3.375 * B} scale={1 / 4} />
        <Text content={`stage ${current}`} x={6.5 * B} y={8.5 * B} />
        <g className="button-areas" transform={`translate(${2.5 * B}, ${11 * B})`}>
          <TextButton
            content="prev"
            textFill="white"
            disabled={index === 0}
            x={0}
            y={0}
            onClick={this.onChoosePrev}
          />
          <TextButton
            content="next"
            textFill="white"
            disabled={index === stageNames.length - 1}
            x={3 * B}
            y={0}
            onClick={this.onChooseNext}
          />
          <TextButton
            content="play"
            textFill="#96d332"
            x={6 * B}
            y={0}
            onClick={this.onStartPlay}
          />
          <TextButton content="back" textFill="white" x={9 * B} y={0} />
        </g>
        <g className="hint" transform={`translate(${0.5 * B},${14 * B}) scale(0.5)`}>
          <Text fill="#ccc" content="This page is a little janky. Keep patient." x={0} y={0} />
        </g>
      </g>
    )
  }
}

export default connect(undefined)(ChooseStageScene)
