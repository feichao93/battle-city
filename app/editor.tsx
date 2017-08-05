import 'normalize.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import createSagaMiddleware from 'redux-saga'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import { List, Range, Repeat } from 'immutable'
import { Provider } from 'react-redux'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE as FBZ } from 'utils/constants'
import BrickLayer from 'components/BrickLayer'
import SteelLayer from 'components/SteelLayer'
import RiverLayer from 'components/RiverLayer'
import SnowLayer from 'components/SnowLayer'
import ForestLayer from 'components/ForestLayer'
import Eagle from 'components/Eagle'
import tickEmitter from 'sagas/tickEmitter'
import { time } from 'reducers/index'
import game from 'reducers/game'
import parseStageMap from 'utils/parseStageMap'

const simpleSagaMiddleware = createSagaMiddleware()
const simpleReducer = combineReducers({ time, game })

const simpleStore = createStore(simpleReducer, undefined, applyMiddleware(simpleSagaMiddleware))
simpleSagaMiddleware.run(tickEmitter)

function toString(list: List<MapItem>): StageConfig['map'] {
  const result: string[] = []
  for (let row = 0; row < FBZ; row += 1) {
    const array: string[] = []
    for (let col = 0; col < FBZ; col += 1) {
      const { type, hex } = list.get(row * FBZ + col)
      if (type === 'B') {
        // todo 这样真的对么？
        array.push('B' + hex.toString(16))
      } else if (type === 'E') {
        array.push('E')
      } else if (type === 'R') {
        array.push('R')
      } else if (type === 'S') {
        array.push('S')
      } else if (type === 'T') {
        array.push('T' + hex.toString(16))
      } else { // type === 'X'
        array.push('X')
      }
    }
    result.push(array.join(' '))
  }
  return result
}

export interface MapItem {
  type: 'X' | 'E' | 'B' | 'T' | 'R' | 'S'
  hex: number
}

const DashLines = () => (
  <g
    stroke="steelblue"
    strokeWidth="0.5"
    strokeDasharray="2 2"
  >
    {Range(1, FBZ).map(x =>
      <line
        key={x}
        x1={B * x}
        y1={0}
        x2={B * x}
        y2={15 * B}
      />
    ).toArray()}
    {Range(1, FBZ).map(y =>
      <line
        key={y}
        x1={0}
        y1={B * y}
        x2={16 * B}
        y2={B * y}
      />
    ).toArray()}
  </g>
)

class Editor extends React.Component {
  private svg: SVGSVGElement
  state = {
    map: Repeat({ type: 'X', hex: 0 } as MapItem, FBZ ** 2).toList(),
    item: { type: 'X', hex: 0 } as MapItem,
  }

  onClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const row = Math.floor((event.clientX - this.svg.clientLeft) / B)
    const col = Math.floor((event.clientY - this.svg.clientTop) / B)
    console.log(row, col)
  }

  render() {
    const { map } = this.state
    const { rivers, steels, bricks, snows, forests, eagle } = parseStageMap(toString(map))

    return (
      <svg
        ref={node => (this.svg = node)}
        className="svg"
        width={16 * B}
        height={15 * B}
        onClick={this.onClick}
      >
        <g role="board">
          <rect width={FBZ * B} height={FBZ * B} fill="#000000" />
          <RiverLayer rivers={rivers} />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
          <SnowLayer snows={snows} />
          {eagle ?
            <Eagle
              x={eagle.x}
              y={eagle.y}
              broken={eagle.broken}
            />
            : null}
          <ForestLayer forests={forests} />
        </g>
        <DashLines />
      </svg>
    )
  }
}


ReactDOM.render(
  <Provider store={simpleStore}>
    <Editor />
  </Provider>,
  document.getElementById('container'),
)
