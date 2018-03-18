import * as React from 'react'
import { connect } from 'react-redux'
import * as _ from 'lodash'
import { State, TanksMap, ScoresMap, TankRecord, PlayersMap, ExplosionsMap } from 'app/types'

let connectedInspector: any = () => null as any

if (DEV.INSPECTOR) {
  function roundTank(t: TankRecord) {
    return t
      .update('x', Math.round)
      .update('y', Math.round)
      .update('cooldown', Math.round)
      .update('helmetDuration', Math.round)
  }

  type View = 'scores' | 'tanks' | 'players' | 'explosions'

  interface S {
    view: View
    allScores: ScoresMap
    allTanks: TanksMap
    allPlayers: PlayersMap
    allExplosions: ExplosionsMap
  }

  class Inspector extends React.PureComponent<State, S> {
    state = {
      view: 'scores' as View,
      allScores: this.props.scores,
      allTanks: this.props.tanks.map(roundTank),
      allPlayers: this.props.players,
      allExplosions: this.props.explosions,
    }

    componentWillReceiveProps(nextProps: State) {
      const { scores, tanks, players, explosions } = this.props
      const { allScores, allTanks, allPlayers, allExplosions } = this.state
      this.setState({
        allScores: allScores.merge(scores),
        allTanks: allTanks.merge(tanks.map(roundTank)),
        allPlayers: allPlayers.merge(players),
        allExplosions: allExplosions.merge(explosions),
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
      const { players } = this.props
      const { allPlayers } = this.state
      return (
        <div role="players-view">
          {allPlayers.isEmpty() ? <p> EMPTY PLAYERS </p> : null}
          {allPlayers
            .map(p => (
              <pre
                key={p.playerName}
                style={{
                  textDecoration: players.has(p.playerName) ? 'none' : 'line-through',
                }}
              >
                {JSON.stringify(p, null, 2)}
              </pre>
            ))
            .toArray()}
        </div>
      )
    }

    renderExplosionsView() {
      const { explosions } = this.props
      const { allExplosions } = this.state
      return (
        <div role="explosions-view">
          {allExplosions.isEmpty() ? <p>EMPTY EXPLOSIONS</p> : null}
          {allExplosions
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
            .toArray()}
        </div>
      )
    }

    renderTanksView() {
      const { tanks } = this.props
      const { allTanks } = this.state
      return (
        <div role="tanks-view">
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
            .toArray()}
        </div>
      )
    }

    renderScoresView() {
      const { scores } = this.props
      const { allScores } = this.state
      return (
        <div>
          {allScores.isEmpty() ? <p>EMPTY</p> : null}
          {allScores
            .map(s => (
              <pre
                key={s.scoreId}
                style={{
                  textDecoration: scores.has(s.scoreId) ? 'none' : 'line-through',
                }}
              >
                {JSON.stringify(s, null, 2)}
              </pre>
            ))
            .toArray()}
        </div>
      )
    }

    render() {
      const { view } = this.state
      return (
        <div
          style={{
            maxHeight: '100vh',
            overflow: 'auto',
            fontSize: '12px',
            border: '1px solid red',
          }}
        >
          <div style={{ display: 'flex' }}>
            <button
              style={{ color: view === 'scores' ? 'green' : 'inherit' }}
              onClick={() => this.setState({ view: 'scores' })}
            >
              Score
            </button>
            <button
              style={{ color: view === 'tanks' ? 'green' : 'inherit' }}
              onClick={() => this.setState({ view: 'tanks' })}
            >
              Tanks
            </button>
            <button
              style={{ color: view === 'players' ? 'green' : 'inherit' }}
              onClick={() => this.setState({ view: 'players' })}
            >
              Players
            </button>
            <button
              style={{ color: view === 'explosions' ? 'green' : 'inherit' }}
              onClick={() => this.setState({ view: 'explosions' })}
            >
              Explosions
            </button>
            <button onClick={this.debugger}>debugger</button>
          </div>
          {view === 'scores' ? this.renderScoresView() : null}
          {view === 'tanks' ? this.renderTanksView() : null}
          {view === 'players' ? this.renderPlayersView() : null}
          {view === 'explosions' ? this.renderExplosionsView() : null}
        </div>
      )
    }
  }

  connectedInspector = connect<State>(_.identity)(Inspector)
}

export default connectedInspector
