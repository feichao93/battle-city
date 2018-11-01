import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { State, TankRecord, TanksMap } from '../../types'
import * as selectors from '../../utils/selectors'

let connectedInspector: any = () => null as any

if (DEV.INSPECTOR) {
  function roundTank(t: TankRecord) {
    return t
      .update('x', Math.round)
      .update('y', Math.round)
      .update('cooldown', Math.round)
      .update('helmetDuration', Math.round)
  }

  type View = 'players' | 'tanks' | 'explosions'

  interface S {
    view: View
    allTanks: TanksMap
  }

  class Inspector extends React.PureComponent<State, S> {
    state = {
      view: 'players' as View,
      allTanks: this.props.tanks.map(roundTank),
    }

    componentWillReceiveProps(nextProps: State) {
      const { tanks } = nextProps
      const { allTanks } = this.state
      this.setState({
        allTanks: allTanks.merge(tanks.map(roundTank)),
      })
    }

    debugger = () => {
      console.log('state =', this.state)
      console.log('props =', this.props)
      ;(function(w: any) {
        w.state = this.state
        w.props = this.props
      }.call(this, window))
      debugger
    }

    renderPlayersView() {
      const { player1, player2 } = this.props
      const inMultiPlayersMode = selectors.isInMultiPlayersMode(this.props)
      return (
        <div className="players-view">
          <pre>{inMultiPlayersMode ? '多人模式' : '单人模式'}</pre>
          <pre>{JSON.stringify(player1, null, 2)}</pre>
          {inMultiPlayersMode && <pre>{JSON.stringify(player2, null, 2)}</pre>}
        </div>
      )
    }

    renderExplosionsView() {
      const { explosions } = this.props
      return (
        <div className="explosions-view">
          {explosions.isEmpty() ? (
            <p>EMPTY EXPLOSIONS</p>
          ) : (
            explosions
              .map(exp => (
                <pre
                  key={exp.explosionId}
                  style={{
                    textDecoration: explosions.has(exp.explosionId) ? 'none' : 'line-through',
                  }}
                >
                  {JSON.stringify(exp, null, 2)}
                </pre>
              ))
              .valueSeq()
          )}
        </div>
      )
    }

    renderTanksView() {
      const { tanks } = this.props
      const { allTanks } = this.state
      return (
        <div className="tanks-view">
          {allTanks.isEmpty() ? <p>EMPTY TANKS</p> : null}
          {allTanks
            .map(t => (
              <pre
                key={t.tankId}
                style={{
                  textDecoration: tanks.has(t.tankId) ? 'none' : 'line-through',
                }}
              >
                {JSON.stringify(t, null, 2)}
              </pre>
            ))
            .valueSeq()}
        </div>
      )
    }

    render() {
      const { view } = this.state
      return (
        <div
          style={{
            width: 240,
            maxHeight: 480,
            overflow: 'auto',
            fontSize: '12px',
            border: '1px dashed #ccc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            view:
            <select
              value={this.state.view}
              onChange={e => this.setState({ view: e.target.value as View })}
            >
              <option value="players">players</option>
              <option value="tanks">tanks</option>
              <option value="explosions">explosions</option>
            </select>
            <button style={{ marginLeft: 8 }} onClick={this.debugger}>
              debugger
            </button>
          </div>
          {view === 'players' ? this.renderPlayersView() : null}
          {view === 'tanks' ? this.renderTanksView() : null}
          {view === 'explosions' ? this.renderExplosionsView() : null}
        </div>
      )
    }
  }

  connectedInspector = connect<State>(_.identity)(Inspector)
}

export default connectedInspector
