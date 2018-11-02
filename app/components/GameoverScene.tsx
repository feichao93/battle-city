import React, { useEffect } from 'react'
import useKeyboard from '../hooks/useKeyboard'
import { useRedux } from '../ReduxContext'
import { BLOCK_SIZE as B, ITEM_SIZE_MAP } from '../utils/constants'
import history from '../utils/history'
import BrickWall from './BrickWall'
import Screen from './Screen'
import Text from './Text'
import TextButton from './TextButton'

export const GameoverSceneContent = React.memo(({ onRestart }: { onRestart?: () => void }) => {
  const size = ITEM_SIZE_MAP.BRICK
  const scale = 4
  return (
    <g className="gameover-scene">
      <defs>
        <pattern
          id="pattern-brickwall"
          width={(size * 2) / scale}
          height={(size * 2) / scale}
          patternUnits="userSpaceOnUse"
        >
          <g transform={`scale(${1 / scale})`}>
            <BrickWall x={0} y={0} />
            <BrickWall x={0} y={size} />
            <BrickWall x={size} y={0} />
            <BrickWall x={size} y={size} />
          </g>
        </pattern>
      </defs>
      <rect fill="#000000" x={0} y={0} width={16 * B} height={15 * B} />
      <g transform={`scale(${scale})`}>
        <Text
          content="game"
          x={(4 * B) / scale}
          y={(4 * B) / scale}
          fill="url(#pattern-brickwall)"
        />
        <Text
          content="over"
          x={(4 * B) / scale}
          y={(7 * B) / scale}
          fill="url(#pattern-brickwall)"
        />
      </g>
      <g transform={`translate(${5.75 * B}, ${13 * B}) scale(0.5)`}>
        <TextButton
          content="press R to restart"
          x={0}
          y={0}
          textFill="#9ed046"
          onClick={onRestart}
        />
      </g>
    </g>
  )
})

// TODO 需要考虑 multi-players 的情况
export default function GameoverScene() {
  const [{ game }] = useRedux()

  useKeyboard('keydown', onKeyDown)
  useEffect(
    () => {
      if (game.status === 'idle') {
        history.replace('/')
      }
    },
    [game.status],
  )

  function onKeyDown(event: KeyboardEvent) {
    if (event.code === 'KeyR') {
      onRestart()
    }
  }

  function onRestart() {
    if (game.lastStageName) {
      history.replace(`/choose/${game.lastStageName}`)
    } else {
      history.replace(`/choose`)
    }
  }

  return (
    <Screen>
      <GameoverSceneContent onRestart={onRestart} />
    </Screen>
  )
}
