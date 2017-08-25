import * as React from 'react'
import { connect } from 'react-redux'
import * as _ from 'lodash'
import { State, TanksMap, ScoresMap, TankRecord, PlayersMap, PlayerRecord } from 'types'

function roundTank(t: TankRecord) {
  return t.update('x', Math.round)
    .update('y', Math.round)
    .update('cooldown', Math.round)
}

type View = 'scores' | 'tanks' | 'players'

interface S {
  view: View
  allScores: ScoresMap
  allTanks: TanksMap
  allPlayers: PlayersMap
}

class Inspector extends React.PureComponent<State, S>{
  state = {
    view: 'scores' as View,
    allScores: this.props.scores,
    allTanks: this.props.tanks.map(roundTank),
    allPlayers: this.props.players,
  }

  componentWillReceiveProps(nextProps: State) {
    const { scores, tanks, players } = this.props
    const { allScores, allTanks, allPlayers } = this.state
    this.setState({
      allScores: allScores.merge(scores),
      allTanks: allTanks.merge(tanks.map(roundTank)),
      allPlayers: allPlayers.merge(players),
    })
  }

  debugger = () => {
    console.log('state =', this.state)
    console.log('props =', this.props)
      ; (function (w: any) {
        w.state = this.state
        w.props = this.props
      }).call(this, window)
    debugger
  }

  renderPlayersView() {
    const { players } = this.props
    const { allPlayers } = this.state
    return (
      <div role="players-view">
        {allPlayers.isEmpty() ? <p> EMPTY PLAYERS </p> : null}
        {allPlayers.map(p =>
          <pre
            key={p.playerName}
            style={{
              textDecoration: players.has(p.playerName) ? 'none' : 'line-through',
            }}
          >
            {JSON.stringify(p, null, 2)}
          </pre>
        ).toArray()}
      </div>
    )
  }

  renderTanksView() {
    const { tanks } = this.props
    const { allTanks } = this.state
    return (
      <div role="tanks-view">
        {allTanks.isEmpty() ? <p>EMPTY TANKS</p> : null}
        {allTanks.map(t =>
          <pre
            key={t.tankId}
            style={{
              textDecoration: tanks.has(t.tankId) ? 'none' : 'line-through',
            }}
          >
            {JSON.stringify(t, null, 2)}
          </pre>
        ).toArray()}
      </div>
    )
  }

  renderScoresView() {
    const { scores } = this.props
    const { allScores } = this.state
    return (
      <div>
        {allScores.isEmpty() ? <p>EMPTY</p> : null}
        {allScores.map(s =>
          <pre
            key={s.scoreId}
            style={{
              textDecoration: scores.has(s.scoreId) ? 'none' : 'line-through',
            }}
          >
            {JSON.stringify(s, null, 2)}
          </pre>
        ).toArray()}
      </div>
    )
  }

  render() {
    const { view } = this.state
    return (
      <div style={{
        maxHeight: '100vh',
        overflow: 'auto',
        fontSize: '12px',
        border: '1px solid red',
      }}>
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
          <button onClick={this.debugger}>
            debugger
            </button>
        </div>
        {view === 'scores' ? this.renderScoresView() : null}
        {view === 'tanks' ? this.renderTanksView() : null}
        {view === 'players' ? this.renderPlayersView() : null}
      </div>
    )
  }
}


export default connect(_.identity)(Inspector)
