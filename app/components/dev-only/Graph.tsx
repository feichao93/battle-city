import {
  calculateIdealFireInfoArray,
  getPosInfo,
  getT,
  shortestPathToEagle,
} from 'components/dev-only/shortest-path.ts'
import * as _ from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { State } from 'types'
import { FIELD_BLOCK_SIZE as FBS } from 'utils/constants'

let connectedGraph: any = () => null as any

const colors = {
  red: '#ff0000b3',
  green: '#4caf50aa',
  orange: 'orange',
}

const S = FBS * 2 - 1

if (DEV) {
  interface S {}

  class Graph extends React.PureComponent<State, S> {
    render() {
      const { map, tanks } = this.props
      const posInfo = getPosInfo(map)
      const firstAITank = tanks.find(t => t.active)
      let pathElement: JSX.Element = null
      if (map.eagle && firstAITank) {
        const eagleCol = map.eagle.x / 8
        const eagleRow = map.eagle.y / 8
        const eagleT = eagleRow * (FBS * 2 - 1) + eagleCol
        const idealFireInfoArray = calculateIdealFireInfoArray(map, eagleT)
        for (const fireInfo of idealFireInfoArray) {
          posInfo[fireInfo.t].fireInfo = fireInfo
          posInfo[fireInfo.t].canFire = true
        }
        const pathInfo = shortestPathToEagle(posInfo, getT(firstAITank))
        if (pathInfo.path.length) {
          const points = pathInfo.path.map(t => {
            const row = Math.floor(t / S)
            const col = t % S
            return `${col * 8 + 8},${row * 8 + 8}`
          })
          pathElement = (
            <polyline
              points={points.join(' ')}
              fill="none"
              strokeWidth="3"
              stroke="#ff000096"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        }
      }
      return (
        <g role="graph">
          {pathElement}
          <g role="free-info">
            {posInfo.map((posInfo, t) => {
              const row = Math.floor(t / (FBS * 2 - 1))
              const col = t % (FBS * 2 - 1)
              const brickCount = posInfo.fireInfo ? posInfo.fireInfo.brickCount : ''
              return (
                <g key={t}>
                  <circle
                    key={t}
                    cx={8 * col + 8}
                    cy={8 * row + 8}
                    r={1.5}
                    fill={
                      posInfo.canFire ? colors.orange : posInfo.canPass ? colors.green : colors.red
                    }
                  />
                  <text x={8 * col + 8} y={8 * row + 8} dx={1.5} dy={1} fill="white" fontSize="4">
                    {brickCount}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      )
    }
  }

  connectedGraph = connect<State>(_.identity)(Graph)
}

export default connectedGraph
