import React from 'react'
import { BLOCK_SIZE as B } from '../utils/constants'
import Text from './Text'

type TextInputProps = {
  x: number
  y: number
  maxLength: number
  value: string
  onChange: (newValue: string) => void
}

export default class TextInput extends React.Component<TextInputProps, { focused: boolean }> {
  constructor(props: TextInputProps) {
    super(props)
    this.state = {
      focused: false,
    }
  }

  onFocus = () => {
    this.setState({ focused: true })
  }

  onBlur = () => {
    this.setState({ focused: false })
  }

  onKeyDown = (event: React.KeyboardEvent<SVGGElement>) => {
    const { value, onChange, maxLength } = this.props
    if (event.key === 'Backspace') {
      onChange(value.slice(0, value.length - 1))
    } else if (Text.support(event.key)) {
      onChange((value + event.key).slice(0, maxLength))
    }
  }

  render() {
    const { x, y, maxLength, value } = this.props
    const { focused } = this.state
    return (
      <g
        tabIndex={1}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        onKeyDown={this.onKeyDown}
        style={{ outline: 'none' }}
      >
        <rect
          x={x - 2}
          y={y - 2}
          height={0.5 * B + 4}
          width={maxLength * 0.5 * B + 4}
          fill="transparent"
          stroke="#e91e63"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <Text x={x} y={y} content={value} fill="#ccc" />
        <rect
          x={x + value.length * 8}
          y={y - 1.5}
          width="1"
          height="11"
          fill={focused ? 'orange' : 'transparent'}
        />
      </g>
    )
  }
}
