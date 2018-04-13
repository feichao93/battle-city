import identity from 'lodash/identity'
import React from 'react'
import { connect } from 'react-redux'
import { FireEstimate, getFireResist, mergeEstMap } from '../../ai/fire-utils'
import getAllSpots from '../../ai/getAllSpots'
import { around, getTankSpot } from '../../ai/spot-utils'
import { State } from '../../reducers'

let connectedSpotGraph: any = () => null as any

if (DEV.SPOT_GRAPH) {
  const colors = {
    red: '#ff0000b3',
    green: '#4caf50aa',
    orange: 'orange',
  }

  class SpotGraph extends React.PureComponent<State> {
    render() {
      const { map } = this.props
      const allSpots = getAllSpots(map)
      let estMap = new Map<number, FireEstimate>()
      if (map.eagle) {
        estMap = around(getTankSpot(map.eagle))
          .map(t => allSpots[t].getIdealFireEstMap(map))
          .reduce(mergeEstMap)
      }
      return (
        <g className="spot-graph">
          {allSpots.map((spot, t) => {
            const row = Math.floor(t / 26)
            const col = t % 26
            if (row === 0 || col === 0) {
              return null
            }
            const est = estMap.get(t)
            const fireResist = est ? getFireResist(est) : ''
            return (
              <g key={t}>
                <circle
                  key={t}
                  cx={8 * col}
                  cy={8 * row}
                  r={1.5}
                  fill={spot.canPass ? (est ? colors.orange : colors.green) : colors.red}
                />
                <text x={8 * col} y={8 * row} dx={1.5} dy={1} fill="white" fontSize="2.5">
                  {fireResist}
                </text>
              </g>
            )
          })}
        </g>
      )
    }
  }

  connectedSpotGraph = connect<State>(identity)(SpotGraph)
}

export default connectedSpotGraph
