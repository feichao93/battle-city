import React from 'react'
import Text from 'components/Text'
import { BLOCK_SIZE as B } from 'utils/constants'

interface S {
  visible: boolean
}

export default class PauseIndicator extends React.PureComponent<object, S> {
  private handle: any = null

  state = {
    visible: true,
  }

  componentDidMount() {
    this.handle = setInterval(() => this.setState({ visible: !this.state.visible }), 250)
  }

  componentWillUnmount() {
    clearInterval(this.handle)
  }

  render() {
    return (
      <g role="pause-indicator">
        <Text
          content="pause"
          x={6.25 * B}
          y={8 * B}
          fill="#db2b00"
          style={{ visibility: this.state.visible ? 'visible' : 'hidden' }}
        />
      </g>
    )
  }
}
