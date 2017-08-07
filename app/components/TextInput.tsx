import * as React from 'react'
import Text from 'components/Text'
import { BLOCK_SIZE as B } from 'utils/constants'

type TextInputProps = {
  x: number
  y: number
  maxLength: number
  value: string
  onChange: (newValue: string) => void
}

export default class TextInput extends React.Component<TextInputProps, { focused: boolean }> {
  input: HTMLInputElement

  constructor(props: TextInputProps) {
    super(props)
    this.state = {
      focused: false,
    }
  }

  componentDidMount() {
    this.input = document.createElement('input')
    this.input.type = 'text'
    this.input.value = this.props.value

    // this styles will make input invisible
    this.input.style.position = 'absolute'
    this.input.style.width = '0'
    this.input.style.border = 'none'

    this.input.addEventListener('blur', this.onBlur)
    this.input.addEventListener('input', this.onInput)

    document.body.appendChild(this.input)
  }

  componentWillUnmount() {
    this.input.removeEventListener('blur', this.onBlur)
    this.input.removeEventListener('input', this.onInput)

    this.input.remove()
  }

  onBlur = () => this.setState({ focused: false })

  onInput = () => {
    const { maxLength } = this.props
    const rawValue = this.input.value
    const value = Array.from(rawValue).filter(Text.support).join('').substring(0, maxLength)
    this.input.value = value
    this.props.onChange(value)
  }

  onFocus = () => {
    this.input.focus()
    this.setState({ focused: true })
  }

  render() {
    const { x, y, maxLength, value } = this.props
    const { focused } = this.state
    return (
      <g onClick={this.onFocus}>
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
