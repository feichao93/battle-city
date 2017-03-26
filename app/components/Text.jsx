/* eslint-disable react/prop-types */
import React from 'react'

// 该文件内每个字符的尺寸都是 8 * 8

const chars = {
  ' ': () => <g role="character-blank" />,
  0: ({ fill }) => (
    <path
      role="character-0"
      fill={fill}
      d="M3,0 h3  v1  h1  v1  h1  v3  h-1 v1  h-1 v-4 h-1 v-1 h-2 v-1
         M6,7 h-3 v-1 h-1 v-1 h-1 v-3 h1  v-1 h1  v4  h1  v1  h2  v1"
    />
  ),
  1: ({ fill }) => (
    <path
      role="character-1"
      fill={fill}
      d="M4,0 h2 v6 h2 v1 h-6 v-1 h2 v-4 h-1 v-1 h1 v-1"
    />
  ),
  2: ({ fill }) => (
    <path
      role="character-2"
      fill={fill}
      d="M2,0 h5 v1 h1 v2 h-1 v1 h-1 v1 h-2 v1 h4 v1 h-7
        v-2 h1 v-1 h1 v-1 h2 v-1 h1 v-1 h-3 v1 h-2 v-1 h1 v-1"
    />
  ),
  3: ({ fill }) => (
    <path
      role="character-3"
      fill={fill}
      d="M2,0 h6 v1 h-1 v1 h-1 v1 h1 v1 h1 v2 h-1 v1 h-5
        v-1 h-1 v-1 h2 v1 h3 v-2 h-3 v-1 h1 v-1 h1 v-1 h-3 v-1"
    />
  ),
  4: ({ fill }) => (
    <path
      role="character-4"
      fill={fill}
      d="M4,0 h3 v4 h-2 v-2 h-1 v1 h-1 v1 h5 v1 h-1
        v2 h-2 v-2 h-4 v-2 h1 v-1 h1 v-1 h1 v-1"
    />
  ),
  5: ({ fill }) => (
    <path
      role="character-5"
      fill={fill}
      d="M1,0 h6 v1 h-4 v1 h4 v1 h1 v3 h-1 v1 h-5 v-1 h-1 v-1 h2 v1 h3 v-3 h-5 v-3"
    />
  ),
  6: ({ fill }) => (
    <path
      role="character-6"
      fill={fill}
      d="M3,0 h3 v1 h-2 v1 h-1 v4 h3 v-2 h-3 v-1 h4 v1 h1 v2 h-1 v1 h-5
        v-1 h-1 v-4 h1 v-1 h1 v-1"
    />
  ),
  7: ({ fill }) => (
    <path
      role="character-7"
      fill={fill}
      d="M1,0 h7 v2 h-1 v1 h-1 v1 h-1 v3 h-2 v-3 h1 v-1 h1 v-1 h1 v-1 h-3 v1 h-2 v-2"
    />
  ),
  8: ({ fill }) => (
    <g role="character-8" fill={fill}>
      <path
        d="M2,0 h4 v1 h-3 v1 h1 v1 h2 v1 h2 v2 h-1 v1 h-5 v-1 h4 v-1 h-2 v-1 h-2  v-1 h-1 v-2 h1 v-1"
      />
      <rect x={6} y={1} width={1} height={2} />
      <rect x={1} y={4} width={1} height={2} />
    </g>
  ),
  9: ({ fill }) => (
    <path
      role="character-9"
      fill={fill}
      d="M2,0 h5 v1 h1 v4 h-1 v1 h-1 v1 h-4 v-1 h3 v-1 h1 v-4 h-3 v2 h3 v1 h-4 v-1 h-1 v-2 h1 v-1"
    />
  ),
  a: ({ fill }) => (
    <g role="character-a" fill={fill}>
      <path d="M3,0 h3 v1 h1 v1 h1 v5 h-2 v-5 h-1 v-1 h-1 v1 h-1 v5 h-2 v-5 h1 v-1 h1 v-1" />
      <rect x={3} y={4} width={3} height={1} />
    </g>
  ),
  e: ({ fill }) => (
    <g role="character-e" fill={fill}>
      <rect x={2} y={0} width={2} height={7} />
      <rect x={4} y={0} width={4} height={1} />
      <rect x={4} y={3} width={3} height={1} />
      <rect x={4} y={6} width={4} height={1} />
    </g>
  ),
  g: ({ fill }) => (
    <path
      role="character-g"
      fill={fill}
      d="M3,0 h5 v1 h-4 v1 h-1 v3 h1 v1 h2 v-2 h-1 v-1 h3 v4 h-5 v-1 h-1 v-1 h-1 v-3 h1 v-1 h1 v-1"
    />
  ),
  m: ({ fill }) => (
    <path
      role="character-m"
      fill={fill}
      d="M1,0 h2 v1 h1 v1 h1 v-1 h1 v-1 h2 v7 h-2 v-3 h-1 v1 h-1 v-1 h-1 v3 h-2 v-7"
    />
  ),
  o: ({ fill }) => (
    <g role="character-p" fill={fill}>
      <rect x={2} y={0} width={5} height={1} />
      <rect x={2} y={6} width={5} height={1} />
      <rect x={1} y={1} width={2} height={5} />
      <rect x={6} y={1} width={2} height={5} />
    </g>
  ),
  p: ({ fill }) => (
    <g role="character-p" fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={4} height={1} />
      <rect x={3} y={4} width={3} height={1} />
      <rect x={6} y={1} width={2} height={3} />
    </g>
  ),
  r: ({ fill }) => (
    <path
      role="character-r"
      fill={fill}
      d="M1,0 h6 v1 h1 v3 h-3 v-1 h1 v-2 h-3 v3 h3 v1 h1 v1 h1 v1 h-3 v-1 h-1 v-1 h-1 v2 h-2 v-7"
    />
  ),
  s: ({ fill }) => (
    <path
      role="character-s"
      fill={fill}
      d="M2,0 h4 v1 h1 v1 h-2 v-1 h-2 v2 h4 v1 h1 v2 h-1 v1
        h-5 v-1 h-1 v-1 h2 v1 h3 v-2 h-4 v-1 h-1 v-2 h1 v-1"
    />
  ),
  t: ({ fill }) => (
    <g role="character-t" fill={fill}>
      <rect x={2} y={0} width={6} height={1} />
      <rect x={4} y={1} width={2} height={6} />
    </g>
  ),
  u: ({ fill }) => (
    <g role="character-u" fill={fill}>
      <rect x={1} y={0} width={2} height={6} />
      <rect x={6} y={0} width={2} height={6} />
      <rect x={2} y={6} width={5} height={1} />
    </g>
  ),
  v: ({ fill }) => (
    <path
      role="character-v"
      fill={fill}
      d="M1,0 h2 v3 h1 v1 h1 v-1 h1 v-3 h2 v4 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-4"
    />
  ),
}

export default class Text extends React.PureComponent {
  static propTypes = {
    content: React.PropTypes.string.isRequired,
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    fill: React.PropTypes.string.isRequired,
  }

  render() {
    const { content, x, y, fill } = this.props
    return (
      <g role="text" transform={`translate(${x},${y})`}>
        {Array.from(content.toLowerCase()).map((char, i) => {
          const Component = chars[char]
          if (Component != null) {
            return (
              <g key={i} transform={`translate(${8 * i},0)`}>
                <Component fill={fill} />
              </g>
            )
          } else {
            // eslint-disable-next-line no-console
            console.warn(`Character '${char}' Not Implemented.`)
            return null
          }
        })}
      </g>
    )
  }
}
