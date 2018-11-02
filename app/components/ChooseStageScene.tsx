import React from 'react'
import { match, Redirect } from 'react-router-dom'
import useKeyboard from '../hooks/useKeyboard'
import { useRedux } from '../ReduxContext'
import { BLOCK_SIZE as B, PLAYER_CONFIGS } from '../utils/constants'
import history from '../utils/history'
import Screen from './Screen'
import StagePreview from './StagePreview'
import Text from './Text'
import TextButton from './TextButton'

interface ChooseStageSceneProps {
  location: Location
  match: match<{ stageName: string }>
}

const ChooseStageScene = ({ match, location }: ChooseStageSceneProps) => {
  useKeyboard('keydown', onKeyDown)
  const [{ stages }] = useRedux()

  const stageNames = stages.map(s => s.name)
  const { stageName } = match.params
  if (!stageNames.includes(stageName)) {
    return <Redirect to={`${match.url}/${stageNames.first()}`} />
  }
  const index = stageNames.indexOf(stageName)
  DEV.ASSERT && console.assert(index !== -1)

  function onKeyDown(event: KeyboardEvent) {
    const config = PLAYER_CONFIGS.player1
    if (event.code === config.control.left) {
      onChoosePrevStage()
    } else if (event.code === config.control.right) {
      onChooseNextStage()
    } else if (event.code === config.control.fire) {
      onStartPlay()
    }
  }

  function onChoose(stageName: string) {
    history.replace(`/choose/${stageName}${location.search}`)
  }

  function onChoosePrevStage() {
    if (index > 0) {
      onChoose(stages.get(index - 1).name)
    }
  }

  function onChooseNextStage() {
    if (index < stages.size - 1) {
      onChoose(stages.get(index + 1).name)
    }
  }

  function onStartPlay() {
    const { stageName } = match.params
    history.push(`/stage/${stageName}${location.search}`)
  }

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
      <StagePreview key={index} stage={stages.get(index)} x={4.75 * B} y={2.75 * B} scale={1 / 2} />
      <StagePreview
        key={index + 1}
        stage={stages.get(index + 1)}
        x={12 * B}
        y={4.375 * B}
        scale={1 / 4}
      />
      <Text content={`stage ${stageName}`} x={6.5 * B} y={9.75 * B} />
      <g className="button-areas" transform={`translate(${2.5 * B}, ${12 * B})`}>
        <TextButton content="prev" disabled={index === 0} x={0} y={0} onClick={onChoosePrevStage} />
        <TextButton
          content="next"
          disabled={index === stageNames.size - 1}
          x={3 * B}
          y={0}
          onClick={onChooseNextStage}
        />
        <TextButton content="play" stroke="#96d332" x={6 * B} y={0} onClick={onStartPlay} />
        <TextButton content="back" x={9 * B} y={0} onClick={() => history.replace('/')} />
      </g>
      <g className="hint" transform={`translate(${0.5 * B},${14.5 * B}) scale(0.5)`}>
        <Text fill="#999" content="Press left or right to choose stages. Press fire to start." />
      </g>
    </Screen>
  )
}

export default ChooseStageScene
