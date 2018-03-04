import * as _ from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { State } from 'types'
import {
  calculateIdealFireInfoArray,
  getPosInfoArray,
  shortestPathToFirePos,
} from 'components/dev-only/shortest-path.ts'

let connectedGraph: any = () => null as any

const colors = {
  red: '#ff0000b3',
  green: '#4caf50aa',
  orange: 'orange',
}

if (DEV) {
  class Graph extends React.PureComponent<State> {
    render() {
      const { map, tanks } = this.props
      const posInfoArray = getPosInfoArray(map)
      const firstAITank = tanks.find(t => t.active && t.side === 'ai')
      let pathElement: JSX.Element = null
      if (map.eagle && firstAITank) {
        const eagleCol = (map.eagle.x + 8) / 8
        const eagleRow = (map.eagle.y + 8) / 8
        const eagleT = eagleRow * 26 + eagleCol
        const idealFireInfoArray = calculateIdealFireInfoArray(map, eagleT)
        for (const fireInfo of idealFireInfoArray) {
          posInfoArray[fireInfo.t].fireInfo = fireInfo
          posInfoArray[fireInfo.t].canFire = true
        }
        const firstAITankT =
          Math.floor((firstAITank.y + 8) / 8) * 26 + Math.floor((firstAITank.x + 8) / 8)
        const pathInfo = shortestPathToFirePos(posInfoArray, firstAITankT)
        if (pathInfo.path.length) {
          const points = pathInfo.path.map(t => {
            const row = Math.floor(t / 26)
            const col = t % 26
            return `${col * 8},${row * 8}`
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
            {posInfoArray.map((posInfo, t) => {
              const row = Math.floor(t / 26)
              const col = t % 26
              if (row === 0 || col === 0) {
                return null
              }
              const brickCount = posInfo.fireInfo ? posInfo.fireInfo.brickCount : ''
              return (
                <g key={t}>
                  <circle
                    key={t}
                    cx={8 * col}
                    cy={8 * row}
                    r={1.5}
                    fill={
                      posInfo.canPass
                        ? posInfo.canFire ? colors.orange : colors.green
                        : colors.red
                    }
                  />
                  <text x={8 * col} y={8 * row} dx={1.5} dy={1} fill="white" fontSize="4">
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
