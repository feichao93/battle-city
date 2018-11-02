import React from 'react'
import { useRedux } from '../ReduxContext'
import StageEnterCurtain from './StageEnterCurtain'

export default function CurtainsContainer() {
  const [{ game }] = useRedux()
  const { stageEnterCurtainT: t, comingStageName } = game
  return <StageEnterCurtain content={`stage  ${comingStageName}`} t={t} />
}
