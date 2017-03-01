import React from 'react'
import { connect } from 'react-redux'
import { Tank } from 'components/tanks'
import { BLOCK_SIZE } from 'utils/constants'
import Screen from 'components/Screen'

function mapStateToProps(state) {
  return state.toObject()
}

@connect(mapStateToProps)
export default class App extends React.Component {
  static propTypes = {}

  render() {
    return (
      <svg className="svg" width={16 * BLOCK_SIZE} height={15 * BLOCK_SIZE}>
        <Screen />
      </svg>
    )
  }
}
