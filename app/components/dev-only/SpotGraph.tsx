import identity from 'lodash/identity'
import React from 'react'
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
}

export default connectedSpotGraph
