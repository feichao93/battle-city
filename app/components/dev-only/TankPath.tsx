import * as React from 'react'
import { connect } from 'react-redux'
import { State } from 'types'

let connectedTankPath: any = () => null as any

if (DEV) {
  class TankPath extends React.PureComponent<{ path: number[] }> {
    render() {
      const { path } = this.props
      if (path == null) {
        return null
      }
      const points = path.map(t => {
        const row = Math.floor(t / 26)
        const col = t % 26
        return `${col * 8},${row * 8}`
      })
      return (
        <g className="tank-path">
          <polyline
            points={points.join(' ')}
            fill="none"
            strokeWidth="3"
            stroke="#ff000096"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )
    }
  }

  function mapStateToProps(state: State) {
    return state.devOnly
  }

  connectedTankPath = connect(mapStateToProps)(TankPath)
}

export default connectedTankPath
