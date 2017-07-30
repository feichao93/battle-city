import 'normalize.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import createSgaMiddleware from 'redux-saga'
import { put, take } from 'redux-saga/effects'
import { Tank } from 'components/tanks'
import { time } from 'reducers/index'
import SnowLayer from 'components/SnowLayer'
import SteelLayer from 'components/SteelLayer'
import RiverLayer from 'components/RiverLayer'
import BrickLayer from 'components/BrickLayer'
import ForestLayer from 'components/ForestLayer'
import Text from 'components/Text'
import Eagle from 'components/Eagle'
import parseStageMap from 'utils/parseStageMap'
import { BLOCK_SIZE } from 'utils/constants'
import tickChannel from 'sagas/tickChannel'
import stageConfigs from 'stages/index'

const sagaMiddleware = createSgaMiddleware()
const simpleStore = createStore(combineReducers({ time }), applyMiddleware(sagaMiddleware))
sagaMiddleware.run(function* simpleRootSaga() {
  while (true) {
    yield put(yield take(tickChannel))
  }
})

const Transform = ({ dx = 0, dy = 0, k = 1, children }: any) => (
  <g transform={`translate(${dx}, ${dy}) scale(${k})`}>
    {children}
  </g>
)

const X8 = ({ width = 128, height = 128, children }: any) => (
  <svg className="svg" width={width} height={height} style={{ marginRight: 2 }}>
    <Transform k={8}>
      {children}
    </Transform>
  </svg>
)

const X8Tank = (props: any) => <X8><Tank x={0} y={0} {...props} /></X8>
const X8Text = ({ content }: { content: string }) => (
  <X8 width={content.length * 64} height={64}>
    <Text x={0} y={0} fill="#feac4e" content={content} />
  </X8>
)

const FontLevel1 = ({ children }: any) => (
  <span style={{ fontSize: 30, lineHeight: '50px' }}>{children}</span>
)

const FontLevel2 = ({ children }: any) => (
  <span style={{ fontSize: 20, lineHeight: '32px' }}>{children}</span>
)

const colors = ['yellow', 'green', 'silver', 'red']
const sides = ['ai', 'human']
const levels = ['basic', 'fast', 'power', 'armor']

function Stories() {
  const { bricks, steels, rivers, snows, forests, eagle } = parseStageMap(stageConfigs['test'].map).toObject()

  return (
    <div style={{ fontFamily: 'monospace' }}>
      <details open>
        <summary>
          <FontLevel1>TANKS</FontLevel1>
        </summary>
        {sides.map(side => levels.map(level =>
          <details open key={side + level}>
            <summary>
              <FontLevel2>{side.toUpperCase()} {level}</FontLevel2>
            </summary>
            <div style={{ display: 'flex' }}>
              {colors.map(color =>
                <X8Tank
                  key={color}
                  side={side}
                  level={level}
                  color={color}
                  direction="up"
                />
              )}
            </div>
          </details>
        ))}
      </details>
      <details open>
        <summary>
          <FontLevel1>Test Stage</FontLevel1>
        </summary>
        <svg
          className="svg"
          width={4 * 13 * BLOCK_SIZE}
          height={4 * 13 * BLOCK_SIZE}
        >
          <g transform="scale(4)">
            <rect width={13 * BLOCK_SIZE} height={13 * BLOCK_SIZE} fill="#000000" />
            <RiverLayer rivers={rivers} />
            <SteelLayer steels={steels} />
            <BrickLayer bricks={bricks} />
            <SnowLayer snows={snows} />
            <Eagle
              x={eagle.x}
              y={eagle.y}
              broken={eagle.broken}
            />
            <ForestLayer forests={forests} />
          </g>
        </svg>
      </details>
      <details open>
        <summary>
          <FontLevel1>Texts</FontLevel1>
        </summary>
        <X8Text content="abcdefg" />
        <X8Text content="hijklmn" />
        <X8Text content="opq rst" />
        <X8Text content="uvw xyz" />
        <X8Text content={'\u2160 \u2161 \u2190- '} />
      </details>
    </div>
  )
}


ReactDOM.render(
  <Provider store={simpleStore}>
    <Stories />
  </Provider>,
  document.getElementById('container')
)

