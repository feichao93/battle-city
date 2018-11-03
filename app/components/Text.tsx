import React from 'react'
import Image from '../hocs/Image'

// 该文件内每个字符的尺寸都是 8 * 8

type Chars = { [char: string]: (props: { fill: string }) => JSX.Element }

const chars: Chars = {
  ' ': () => <g className="character-blank" />,
  0: ({ fill }) => (
    <path
      className="character-0"
      fill={fill}
      d="M3,0 h3  v1  h1  v1  h1  v3  h-1 v1  h-1 v-4 h-1 v-1 h-2 v-1 M6,7 h-3 v-1 h-1 v-1 h-1 v-3 h1  v-1 h1  v4  h1  v1  h2  v1"
    />
  ),
  1: ({ fill }) => (
    <path className="character-1" fill={fill} d="M4,0 h2 v6 h2 v1 h-6 v-1 h2 v-4 h-1 v-1 h1 v-1" />
  ),
  2: ({ fill }) => (
    <path
      className="character-2"
      fill={fill}
      d="M2,0 h5 v1 h1 v2 h-1 v1 h-1 v1 h-2 v1 h4 v1 h-7 v-2 h1 v-1 h1 v-1 h2 v-1 h1 v-1 h-3 v1 h-2 v-1 h1 v-1"
    />
  ),
  3: ({ fill }) => (
    <path
      className="character-3"
      fill={fill}
      d="M2,0 h6 v1 h-1 v1 h-1 v1 h1 v1 h1 v2 h-1 v1 h-5 v-1 h-1 v-1 h2 v1 h3 v-2 h-3 v-1 h1 v-1 h1 v-1 h-3 v-1"
    />
  ),
  4: ({ fill }) => (
    <path
      className="character-4"
      fill={fill}
      d="M4,0 h3 v4 h-2 v-2 h-1 v1 h-1 v1 h5 v1 h-1 v2 h-2 v-2 h-4 v-2 h1 v-1 h1 v-1 h1 v-1"
    />
  ),
  5: ({ fill }) => (
    <path
      className="character-5"
      fill={fill}
      d="M1,0 h6 v1 h-4 v1 h4 v1 h1 v3 h-1 v1 h-5 v-1 h-1 v-1 h2 v1 h3 v-3 h-5 v-3"
    />
  ),
  6: ({ fill }) => (
    <path
      className="character-6"
      fill={fill}
      d="M3,0 h3 v1 h-2 v1 h-1 v4 h3 v-2 h-3 v-1 h4 v1 h1 v2 h-1 v1 h-5 v-1 h-1 v-4 h1 v-1 h1 v-1"
    />
  ),
  7: ({ fill }) => (
    <path
      className="character-7"
      fill={fill}
      d="M1,0 h7 v2 h-1 v1 h-1 v1 h-1 v3 h-2 v-3 h1 v-1 h1 v-1 h1 v-1 h-3 v1 h-2 v-2"
    />
  ),
  8: ({ fill }) => (
    <g className="character-8" fill={fill}>
      <path d="M2,0 h4 v1 h-3 v1 h1 v1 h2 v1 h2 v2 h-1 v1 h-5 v-1 h4 v-1 h-2 v-1 h-2  v-1 h-1 v-2 h1 v-1" />
      <rect x={6} y={1} width={1} height={2} />
      <rect x={1} y={4} width={1} height={2} />
    </g>
  ),
  9: ({ fill }) => (
    <path
      className="character-9"
      fill={fill}
      d="M2,0 h5 v1 h1 v4 h-1 v1 h-1 v1 h-4 v-1 h3 v-1 h1 v-4 h-3 v2 h3 v1 h-4 v-1 h-1 v-2 h1 v-1"
    />
  ),
  a: ({ fill }) => (
    <g className="character-a" fill={fill}>
      <path d="M3,0 h3 v1 h1 v1 h1 v5 h-2 v-5 h-1 v-1 h-1 v1 h-1 v5 h-2 v-5 h1 v-1 h1 v-1" />
      <rect x={3} y={4} width={3} height={1} />
    </g>
  ),
  b: ({ fill }) => (
    <g className="character-b" fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={4} height={1} />
      <rect x={3} y={3} width={4} height={1} />
      <rect x={3} y={6} width={4} height={1} />
      <rect x={6} y={1} width={2} height={2} />
      <rect x={6} y={4} width={2} height={2} />
    </g>
  ),
  c: ({ fill }) => (
    <path
      className="character-c"
      fill={fill}
      d="M3,0 h4 v1 h1 v1 h-2 v-1 h-2 v1 h-1 v3 h1 v1 h2 v-1 h2 v1 h-1 v1 h-4 v-1 h-1 v-1 h-1 v-3 h1 v-1 h1 v-1"
    />
  ),
  d: ({ fill }) => (
    <g className="character-d" fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={3} height={1} />
      <rect x={5} y={1} width={2} height={1} />
      <rect x={6} y={2} width={2} height={3} />
      <rect x={5} y={5} width={2} height={1} />
      <rect x={3} y={6} width={3} height={1} />
    </g>
  ),
  e: ({ fill }) => (
    <g className="character-e" fill={fill}>
      <rect x={2} y={0} width={2} height={7} />
      <rect x={4} y={0} width={4} height={1} />
      <rect x={4} y={3} width={3} height={1} />
      <rect x={4} y={6} width={4} height={1} />
    </g>
  ),
  f: ({ fill }) => (
    <g className="character-f" fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={5} height={1} />
      <rect x={3} y={3} width={4} height={1} />
    </g>
  ),
  g: ({ fill }) => (
    <path
      className="character-g"
      fill={fill}
      d="M3,0 h5 v1 h-4 v1 h-1 v3 h1 v1 h2 v-2 h-1 v-1 h3 v4 h-5 v-1 h-1 v-1 h-1 v-3 h1 v-1 h1 v-1"
    />
  ),
  h: ({ fill }) => (
    <g className="character-h" fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={3} width={3} height={1} />
      <rect x={6} y={0} width={2} height={7} />
    </g>
  ),
  i: ({ fill }) => (
    <g className="character-i" fill={fill}>
      <rect x={2} y={0} width={6} height={1} />
      <rect x={4} y={1} width={2} height={5} />
      <rect x={2} y={6} width={6} height={1} />
    </g>
  ),
  j: ({ fill }) => (
    <g className="character-j" fill={fill}>
      <rect x={6} y={0} width={2} height={6} />
      <rect x={1} y={5} width={2} height={1} />
      <rect x={2} y={6} width={5} height={1} />
    </g>
  ),
  k: ({ fill }) => (
    <path
      className="character-k"
      fill={fill}
      d="M1,0 h2 v3 h1 v-1 h1 v-1 h1 v-1 h2 v1 h-1 v1 h-1 v1 h-1 v1 h1 v1 h1 v1 h1 v1 h-3 v-1 h-1 v-1 h-1 v2 h-2 v-7"
    />
  ),
  l: ({ fill }) => (
    <g className="character-l" fill={fill}>
      <rect x={2} y={0} width={2} height={6} />
      <rect x={2} y={6} width={6} height={1} />
    </g>
  ),
  m: ({ fill }) => (
    <path
      className="character-m"
      fill={fill}
      d="M1,0 h2 v1 h1 v1 h1 v-1 h1 v-1 h2 v7 h-2 v-3 h-1 v1 h-1 v-1 h-1 v3 h-2 v-7"
    />
  ),
  n: ({ fill }) => (
    <g className="character-n" fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={6} y={0} width={2} height={7} />
      <rect x={3} y={1} width={1} height={2} />
      <rect x={4} y={2} width={1} height={2} />
      <rect x={5} y={3} width={1} height={2} />
    </g>
  ),
  o: ({ fill }) => (
    <g className="character-o" fill={fill}>
      <rect x={2} y={0} width={5} height={1} />
      <rect x={2} y={6} width={5} height={1} />
      <rect x={1} y={1} width={2} height={5} />
      <rect x={6} y={1} width={2} height={5} />
    </g>
  ),
  p: ({ fill }) => (
    <g className="character-p" fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={4} height={1} />
      <rect x={3} y={4} width={4} height={1} />
      <rect x={6} y={1} width={2} height={3} />
    </g>
  ),
  q: ({ fill }) => (
    <path
      className="character-q"
      fill={fill}
      d="M2,0 h5 v1 h1 v4 h-1 v1 h1 v1 h-1 v-1 h-2 v-1 h-1 v-1 h2 v-3 h-3 v5 h3 v1 h-4 v-1 h-1 v-5 h1 v-1"
    />
  ),
  r: ({ fill }) => (
    <path
      className="character-r"
      fill={fill}
      d="M1,0 h6 v1 h1 v3 h-3 v-1 h1 v-2 h-3 v3 h3 v1 h1 v1 h1 v1 h-3 v-1 h-1 v-1 h-1 v2 h-2 v-7"
    />
  ),
  s: ({ fill }) => (
    <path
      className="character-s"
      fill={fill}
      d="M2,0 h4 v1 h1 v1 h-2 v-1 h-2 v2 h4 v1 h1 v2 h-1 v1 h-5 v-1 h-1 v-1 h2 v1 h3 v-2 h-4 v-1 h-1 v-2 h1 v-1"
    />
  ),
  t: ({ fill }) => (
    <g className="character-t" fill={fill}>
      <rect x={2} y={0} width={6} height={1} />
      <rect x={4} y={1} width={2} height={6} />
    </g>
  ),
  u: ({ fill }) => (
    <g className="character-u" fill={fill}>
      <rect x={1} y={0} width={2} height={6} />
      <rect x={6} y={0} width={2} height={6} />
      <rect x={2} y={6} width={5} height={1} />
    </g>
  ),
  v: ({ fill }) => (
    <path
      className="character-v"
      fill={fill}
      d="M1,0 h2 v3 h1 v1 h1 v-1 h1 v-3 h2 v4 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-4"
    />
  ),
  w: ({ fill }) => (
    <path
      className="character-w"
      fill={fill}
      d="M1,0 h2 v3 h1 v-1 h1 v1 h1 v-3 h2 v7 h-2 v-1 h-1 v-1 h-1 v1 h-1 v1 h-2 v-7"
    />
  ),
  x: ({ fill }) => (
    <path
      className="character-x"
      fill={fill}
      d="M1,0 h2 v1 h1 v1 h1 v-1 h1 v-1 h2 v2 h-1 v1 h-1 v1 h1 v1 h1 v2 h-2 v-1 h-1 v-1 h-1 v1 h-1 v1 h-2 v-2 h1 v-1 h1 v-1 h-1 v-1 h-1 v-2"
    />
  ),
  y: ({ fill }) => (
    <path
      className="character-y"
      fill={fill}
      d="M2,0 h2 v3 h2 v-3 h2 v3 h-1 v1 h-1 v3 h-2 v-3 h-1 v-1 h-1 v-3"
    />
  ),
  z: ({ fill }) => (
    <path
      className="character-z"
      fill={fill}
      d="M1,0 h7 v2 h-1 v1 h-1 v1 h-1 v1 h-1 v1 h4 v1 h-7 v-2 h1 v-1 h1 v-1 h1 v-1 h1 v-1 h-4 v-1"
    />
  ),
  '-': ({ fill }) => (
    <rect className="character-dash" fill={fill} x="1" y="3" width="6" height="2" />
  ),
  '+': ({ fill }) => (
    <g className="character-plus" fill={fill}>
      <rect x="1" y="3" width="6" height="2" />
      <rect x="3" y="1" width="2" height="6" />
    </g>
  ),
  ':': ({ fill }) => (
    <g className="character-colon" fill={fill}>
      <rect x="2" y="1" width="2" height="2" />
      <rect x="2" y="5" width="2" height="2" />
    </g>
  ),
  '.': ({ fill }) => (
    <rect className="character-dot" x="2" y="5" width="2" height="2" fill={fill} />
  ),
  '?': ({ fill }) => (
    <g className="character-question-mark" fill={fill}>
      <path d="M2,0 h5 v1 h1 v2 h-1 v1 h-1 v1 h-3 v-1 h2 v-1 h1 v-2 h-3 v2 h-2 v-2 h1 v-1" />
      <rect x="3" y="6" width="3" height="1" />
    </g>
  ),
  ['\u2160'.toLowerCase()]: ({ fill }) => (
    <path
      className="character-roman-numeral-one"
      fill={fill}
      d="M2,0 h4 v1 h-1 v5 h1 v1 h-4 v-1 h1 v-5 h-1 v-1"
    />
  ),
  ['\u2161'.toLowerCase()]: ({ fill }) => (
    <g className="character-roman-numeral-two" fill={fill}>
      <rect x={2} y={0} width={5} height={1} />
      <rect x={3} y={1} width={1} height={5} />
      <rect x={5} y={1} width={1} height={5} />
      <rect x={2} y={6} width={5} height={1} />
    </g>
  ),
  ['\u2190'.toLowerCase()]: ({ fill }) => (
    <path
      className="character-leftwards-arrow"
      fill={fill}
      d="M1,3 h1 v-1 h1 v-1 h1 v-1 h1 v2 h3 v3 h-3 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1"
    />
  ),
  ['\u2191'.toLowerCase()]: ({ fill }) => (
    <path
      className="character-upwards-arrow"
      transform="translate(8,-1) rotate(90)"
      fill={fill}
      d="M1,3 h1 v-1 h1 v-1 h1 v-1 h1 v2 h3 v3 h-3 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1"
    />
  ),
  ['\u2192'.toLowerCase()]: ({ fill }) => (
    <path
      className="character-rightwards-arrow"
      fill={fill}
      d="M1,2 h3 v-2 h1 v1 h1 v1 h1 v1 h1 v1 h-1 v1 h-1 v1 h-1 v1 h-1 v-2 h-3 v-3"
    />
  ),
  ['\u2193'.toLowerCase()]: ({ fill }) => (
    <path
      className="character-downwards-arrow"
      transform="translate(8,-1) rotate(90)"
      fill={fill}
      d="M1,2 h3 v-2 h1 v1 h1 v1 h1 v1 h1 v1 h-1 v1 h-1 v1 h-1 v1 h-1 v-2 h-3 v-3"
    />
  ),
  ['\u00a9'.toLocaleLowerCase()]: ({ fill }) => (
    <g className="character-copyright-sign" fill={fill}>
      <rect x={2} y={0} width={4} height={1} />
      <rect x={2} y={7} width={4} height={1} />
      <rect x={0} y={2} width={1} height={4} />
      <rect x={7} y={2} width={1} height={4} />
      <rect x={1} y={1} width={1} height={1} />
      <rect x={6} y={1} width={1} height={1} />
      <rect x={1} y={6} width={1} height={1} />
      <rect x={6} y={6} width={1} height={1} />
      <path d="M3,2 h3 v1 h-3 v2 h3 v1 h-3 v-1 h-1 v-2 h1 v-1" />
    </g>
  ),
}

type Props = {
  content: string
  x?: number
  y?: number
  fill?: string
  style?: React.CSSProperties
}

export default class Text extends React.PureComponent<Props> {
  static support(char: string) {
    return char in chars
  }

  render() {
    const { content, x = 0, y = 0, fill = 'white', style = {} } = this.props
    return (
      <g className="text" transform={`translate(${x},${y})`} style={style}>
        {Array.from(content.toLowerCase()).map((char, i) => {
          const Component = chars[char]
          DEV.ASSERT && console.assert(Component != null, `Character '${char}' Not Implemented.`)
          return (
            <g key={i} transform={`translate(${8 * i},0)`}>
              <Component fill={fill} />
            </g>
          )
        })}
      </g>
    )
  }
}
