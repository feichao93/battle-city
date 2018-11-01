import React from 'react'
import ReduxContext from '../ReduxContext'
import StageEnterCurtain from './StageEnterCurtain'

export default function CurtainsContainer() {
  return (
    <ReduxContext.Consumer>
      {({ game: { stageEnterCurtainT: t, comingStageName } }) => (
        <StageEnterCurtain content={`stage  ${comingStageName}`} t={t} />
      )}
    </ReduxContext.Consumer>
  )
}
