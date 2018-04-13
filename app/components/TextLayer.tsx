import React from 'react'
import { TextsMap } from '../types'
import Text from './Text'

export default class TextLayer extends React.PureComponent<{ texts: TextsMap }, {}> {
  render() {
    const { texts } = this.props

    return (
      <g className="text-layer">
        {texts
          .map(t => <Text key={t.textId} content={t.content} fill={t.fill} x={t.x} y={t.y} />)
          .toArray()}
      </g>
    )
  }
}
