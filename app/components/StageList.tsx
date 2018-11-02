import { saveAs } from 'file-saver'
import React from 'react'
import { match, Redirect, Route, Switch } from 'react-router-dom'
import useFileUploader from '../hooks/useFileUploader'
import usePopup from '../hooks/usePopup'
import { useRedux } from '../ReduxContext'
import { RawStageConfig } from '../types'
import { StageConfigConverter } from '../types/StageConfig'
import * as actions from '../utils/actions'
import { BLOCK_SIZE as B } from '../utils/constants'
import history from '../utils/history'
import Screen from './Screen'
import StagePreview from './StagePreview'
import Text from './Text'
import TextButton from './TextButton'

interface StageListProps {
  tab: 'default' | 'custom'
  page: number
  popup: ReturnType<typeof usePopup>
}

const STAGE_COUNT_PER_PAGE = 6
const GAP = 25
const LEN = 52 + GAP

function StageListContent({ tab, page, popup }: StageListProps) {
  const [{ stages: allStages }, dispatch] = useRedux()
  const requestUploadFile = useFileUploader(onFileOpen)

  const filteredStages = allStages.filter(
    s => (s.custom && tab === 'custom') || (!s.custom && tab === 'default'),
  )
  const startIndex = (page - 1) * STAGE_COUNT_PER_PAGE
  const stages = filteredStages.slice(startIndex, startIndex + STAGE_COUNT_PER_PAGE)

  let maxPage: number
  if (tab === 'default') {
    const defaultStageCount = allStages.filter(s => !s.custom).count()
    maxPage = Math.ceil(defaultStageCount / STAGE_COUNT_PER_PAGE)
  } else {
    const customStageCount = allStages.filter(s => s.custom).count()
    maxPage = Math.ceil(customStageCount / STAGE_COUNT_PER_PAGE)
  }

  function onChoosePrevPage() {
    const prev = Math.max(1, page - 1)
    history.replace(`/list/${tab}/${prev}`)
  }

  function onChooseNextPage() {
    const next = Math.min(maxPage, page + 1)
    history.replace(`/list/${tab}/${next}`)
  }

  function onPlay(stageName: string) {
    history.push(`/stage/${stageName}`)
  }

  function onFileOpen(file: File) {
    const fileReader = new FileReader()
    fileReader.readAsText(file)
    fileReader.onloadend = async () => {
      try {
        const raw: RawStageConfig = JSON.parse(fileReader.result as string)
        const stage = StageConfigConverter.r2s(raw).set('custom', true)
        if (stages.some(s => !s.custom && s.name === stage.name)) {
          await popup.showAlertPopup(`Stage ${stage.name} already exists.`)
          return
        }
        if (stages.some(s => s.custom && s.name === stage.name)) {
          const confirmed = await popup.showConfirmPopup(
            'Override exsiting custome stage. continue?',
          )
          if (!confirmed) {
            return
          }
        }
        dispatch(actions.setCustomStage(stage))
        dispatch(actions.syncCustomStages())
        if (tab !== 'custom') {
          history.replace('/list/custom')
        }
      } catch (error) {
        console.error(error)
        await popup.showAlertPopup('Failed to parse stage config file.')
      }
    }
  }

  function onEdit(stageName: string) {
    const stage = stages.find(s => s.name === stageName)
    dispatch(actions.setEditorContent(stage))
    history.push('/editor')
  }

  async function onDelete(stageName: string) {
    if (await popup.showConfirmPopup(`Delete stage ${stageName}?`)) {
      dispatch(actions.removeCustomStage(stageName))
      dispatch(actions.syncCustomStages())
    }
  }

  async function onDownload(stageName: string) {
    const stage = stages.find(s => s.name === stageName)
    const json = StageConfigConverter.s2r(stage)
    delete json.custom
    const content = JSON.stringify(json, null, 2)
    saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), `stage-${stage.name}.json`)
  }

  return (
    <Screen background="#333">
      <Text content="stages" x={0.5 * B} y={0.5 * B} />
      <TextButton
        content="default"
        x={4.5 * B}
        y={0.5 * B}
        selected={tab === 'default'}
        onClick={tab !== 'default' ? () => history.replace('/list/default') : null}
      />
      <TextButton
        content="custom"
        x={8.5 * B}
        y={0.5 * B}
        selected={tab === 'custom'}
        onClick={tab !== 'custom' ? () => history.replace('/list/custom') : null}
      />
      {stages.isEmpty() ? (
        <Text x={0.5 * B} y={3 * B} content="No custom stage." fill="#666666" />
      ) : null}
      <g transform="translate(0, 40)">
        {stages
          .map((stage, index) => {
            const x = GAP + (index % 3) * LEN
            const y = 70 * Math.floor(index / 3)
            return (
              <g key={stage.name} transform={`translate(${x}, ${y}) `}>
                <StagePreview disableImageCache={tab === 'custom'} stage={stage} scale={0.25} />
                <g transform="scale(0.5)">
                  <Text content={stage.name} fill="#dd2664" />
                </g>
                <g transform="translate(0, 56) scale(0.5)">
                  <TextButton x={0 * B} y={0} content="play" onClick={() => onPlay(stage.name)} />
                  <TextButton x={2.5 * B} y={0} content="edit" onClick={() => onEdit(stage.name)} />
                  {stage.custom ? (
                    <TextButton x={5 * B} y={0} content="x" onClick={() => onDelete(stage.name)} />
                  ) : null}
                  <TextButton
                    x={6 * B}
                    y={0}
                    content={'\u2193'}
                    onClick={() => onDownload(stage.name)}
                  />
                </g>
              </g>
            )
          })
          .toArray()}
      </g>
      <g transform={`translate(${6.5 * B}, 0)`}>
        <TextButton
          x={0}
          y={12 * B}
          content={'\u2190'}
          onClick={onChoosePrevPage}
          disabled={page === 1}
        />
        <Text x={1.25 * B} y={12 * B} content={String(page)} />
        <TextButton
          x={2.5 * B}
          y={12 * B}
          content={'\u2192'}
          onClick={onChooseNextPage}
          disabled={page >= maxPage}
        />
      </g>
      <g className="button-areas" transform={`translate(${5.5 * B}, ${13.5 * B})`}>
        <TextButton content="editor" x={0 * B} y={0} onClick={() => history.push('/editor')} />
        <TextButton content="upload" x={3.5 * B} y={0} onClick={requestUploadFile} />
        <TextButton content="back" x={7 * B} y={0} onClick={() => history.goBack()} />
      </g>
      <g className="hint" transform={`translate(${0.5 * B},${14.5 * B}) scale(0.5)`}>
        <Text fill="#999" content="This page is a little janky. Keep patient." />
      </g>
      {popup.element}
    </Screen>
  )
}

const StageList = React.memo(({ match }: { match: match<any> }) => {
  interface PageMatch {
    match: match<{ page: string }>
  }

  const popup = usePopup()

  return (
    <Switch>
      <Route exact path="/list" render={() => <Redirect to="/list/default" />} />
      <Route exact path="/list/default" render={() => <Redirect to="/list/default/1" />} />
      <Route exact path="/list/custom" render={() => <Redirect to="/list/custom/1" />} />
      <Route
        path={`${match.url}/default/:page`}
        render={({
          match: {
            params: { page },
          },
        }: PageMatch) => <StageListContent popup={popup} tab="default" page={Number(page)} />}
      />
      <Route
        path={`${match.url}/custom/:page`}
        render={({
          match: {
            params: { page },
          },
        }: PageMatch) => <StageListContent popup={popup} tab="custom" page={Number(page)} />}
      />
    </Switch>
  )
})

export default StageList
