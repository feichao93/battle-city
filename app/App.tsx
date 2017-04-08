import * as React from 'react'
import { BLOCK_SIZE } from 'utils/constants'
import Screen from 'components/Screen'

export default class App extends React.Component<{}, {}> {
  render() {
    return (
      <svg className="svg" width={16 * BLOCK_SIZE} height={15 * BLOCK_SIZE}>
        <Screen />
      </svg>
    )
  }
}
