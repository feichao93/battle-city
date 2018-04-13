import React from 'react'
import { BLOCK_SIZE as B } from '../utils/constants'
import Curtain from './Curtain'
import Text from './Text'

interface P {
  t: number
  content: string
}

export default class StageEnterCurtain extends React.PureComponent<P> {
  render() {
    const { t, content } = this.props

    return (
      <Curtain name="stage-enter/exit" t={t} x={B} y={B} width={13 * B} height={13 * B}>
        <rect width={13 * B} height={13 * B} fill="#757575" />
        <Text content={content} x={5 * B} y={6 * B} fill="black" />
      </Curtain>
    )
  }
}
