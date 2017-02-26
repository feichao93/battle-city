import React from 'react'
import { connect } from 'react-redux'

function mapStateToProps(state) {
  return state.toObject()
}

@connect(mapStateToProps)
export default class App extends React.Component {
  static propTypes = {}

  render() {
    return (
      <h1>foo</h1>
    )
  }
}
