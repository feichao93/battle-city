import { Range } from 'immutable'
import React from 'react'
import { BLOCK_SIZE as B } from '../utils/constants'
import Text from './Text'

export interface TextWithLineWrapProps {
  x: number
  y: number
  fill?: string
  maxLength: number
  content: string
  lineSpacing?: number
}

export default ({
  x,
  y,
  fill,
  maxLength,
  content,
  lineSpacing = 0.25 * B,
}: TextWithLineWrapProps) => (
  <g className="text-with-line-wrap">
    {Range(0, Math.ceil(content.length / maxLength))
      .map(index => (
        <Text
          key={index}
          x={x}
          y={y + (0.5 * B + lineSpacing) * index}
          fill={fill}
          content={content.substring(index * maxLength, (index + 1) * maxLength)}
        />
      ))
      .toArray()}
  </g>
)
