import type { CSSProperties, ReactElement } from 'react'

// 8×8 像素位图字体，
// 每个字符在 8×8 的格子内用 <path>/<rect> 拼出。

type CharComponent = (props: { fill: string }) => ReactElement
type Chars = Record<string, CharComponent>

const chars: Chars = {
  ' ': () => <g className="character-blank" />,
  0: ({ fill }) => (
    <path
      fill={fill}
      d="M3,0 h3  v1  h1  v1  h1  v3  h-1 v1  h-1 v-4 h-1 v-1 h-2 v-1 M6,7 h-3 v-1 h-1 v-1 h-1 v-3 h1  v-1 h1  v4  h1  v1  h2  v1"
    />
  ),
  1: ({ fill }) => <path fill={fill} d="M4,0 h2 v6 h2 v1 h-6 v-1 h2 v-4 h-1 v-1 h1 v-1" />,
  2: ({ fill }) => (
    <path
      fill={fill}
      d="M2,0 h5 v1 h1 v2 h-1 v1 h-1 v1 h-2 v1 h4 v1 h-7 v-2 h1 v-1 h1 v-1 h2 v-1 h1 v-1 h-3 v1 h-2 v-1 h1 v-1"
    />
  ),
  3: ({ fill }) => (
    <path
      fill={fill}
      d="M2,0 h6 v1 h-1 v1 h-1 v1 h1 v1 h1 v2 h-1 v1 h-5 v-1 h-1 v-1 h2 v1 h3 v-2 h-3 v-1 h1 v-1 h1 v-1 h-3 v-1"
    />
  ),
  4: ({ fill }) => (
    <path
      fill={fill}
      d="M4,0 h3 v4 h-2 v-2 h-1 v1 h-1 v1 h5 v1 h-1 v2 h-2 v-2 h-4 v-2 h1 v-1 h1 v-1 h1 v-1"
    />
  ),
  5: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h6 v1 h-4 v1 h4 v1 h1 v3 h-1 v1 h-5 v-1 h-1 v-1 h2 v1 h3 v-3 h-5 v-3"
    />
  ),
  6: ({ fill }) => (
    <path
      fill={fill}
      d="M3,0 h3 v1 h-2 v1 h-1 v4 h3 v-2 h-3 v-1 h4 v1 h1 v2 h-1 v1 h-5 v-1 h-1 v-4 h1 v-1 h1 v-1"
    />
  ),
  7: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h7 v2 h-1 v1 h-1 v1 h-1 v3 h-2 v-3 h1 v-1 h1 v-1 h1 v-1 h-3 v1 h-2 v-2"
    />
  ),
  8: ({ fill }) => (
    <g fill={fill}>
      <path d="M2,0 h4 v1 h-3 v1 h1 v1 h2 v1 h2 v2 h-1 v1 h-5 v-1 h4 v-1 h-2 v-1 h-2  v-1 h-1 v-2 h1 v-1" />
      <rect x={6} y={1} width={1} height={2} />
      <rect x={1} y={4} width={1} height={2} />
    </g>
  ),
  9: ({ fill }) => (
    <path
      fill={fill}
      d="M2,0 h5 v1 h1 v4 h-1 v1 h-1 v1 h-4 v-1 h3 v-1 h1 v-4 h-3 v2 h3 v1 h-4 v-1 h-1 v-2 h1 v-1"
    />
  ),
  a: ({ fill }) => (
    <g fill={fill}>
      <path d="M3,0 h3 v1 h1 v1 h1 v5 h-2 v-5 h-1 v-1 h-1 v1 h-1 v5 h-2 v-5 h1 v-1 h1 v-1" />
      <rect x={3} y={4} width={3} height={1} />
    </g>
  ),
  b: ({ fill }) => (
    <g fill={fill}>
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
      fill={fill}
      d="M3,0 h4 v1 h1 v1 h-2 v-1 h-2 v1 h-1 v3 h1 v1 h2 v-1 h2 v1 h-1 v1 h-4 v-1 h-1 v-1 h-1 v-3 h1 v-1 h1 v-1"
    />
  ),
  d: ({ fill }) => (
    <g fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={3} height={1} />
      <rect x={5} y={1} width={2} height={1} />
      <rect x={6} y={2} width={2} height={3} />
      <rect x={5} y={5} width={2} height={1} />
      <rect x={3} y={6} width={3} height={1} />
    </g>
  ),
  e: ({ fill }) => (
    <g fill={fill}>
      <rect x={2} y={0} width={2} height={7} />
      <rect x={4} y={0} width={4} height={1} />
      <rect x={4} y={3} width={3} height={1} />
      <rect x={4} y={6} width={4} height={1} />
    </g>
  ),
  f: ({ fill }) => (
    <g fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={5} height={1} />
      <rect x={3} y={3} width={4} height={1} />
    </g>
  ),
  g: ({ fill }) => (
    <path
      fill={fill}
      d="M3,0 h5 v1 h-4 v1 h-1 v3 h1 v1 h2 v-2 h-1 v-1 h3 v4 h-5 v-1 h-1 v-1 h-1 v-3 h1 v-1 h1 v-1"
    />
  ),
  h: ({ fill }) => (
    <g fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={3} width={3} height={1} />
      <rect x={6} y={0} width={2} height={7} />
    </g>
  ),
  i: ({ fill }) => (
    <g fill={fill}>
      <rect x={2} y={0} width={6} height={1} />
      <rect x={4} y={1} width={2} height={5} />
      <rect x={2} y={6} width={6} height={1} />
    </g>
  ),
  j: ({ fill }) => (
    <g fill={fill}>
      <rect x={6} y={0} width={2} height={6} />
      <rect x={1} y={5} width={2} height={1} />
      <rect x={2} y={6} width={5} height={1} />
    </g>
  ),
  k: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h2 v3 h1 v-1 h1 v-1 h1 v-1 h2 v1 h-1 v1 h-1 v1 h-1 v1 h1 v1 h1 v1 h1 v1 h-3 v-1 h-1 v-1 h-1 v2 h-2 v-7"
    />
  ),
  l: ({ fill }) => (
    <g fill={fill}>
      <rect x={2} y={0} width={2} height={6} />
      <rect x={2} y={6} width={6} height={1} />
    </g>
  ),
  m: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h2 v1 h1 v1 h1 v-1 h1 v-1 h2 v7 h-2 v-3 h-1 v1 h-1 v-1 h-1 v3 h-2 v-7"
    />
  ),
  n: ({ fill }) => (
    <g fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={6} y={0} width={2} height={7} />
      <rect x={3} y={1} width={1} height={2} />
      <rect x={4} y={2} width={1} height={2} />
      <rect x={5} y={3} width={1} height={2} />
    </g>
  ),
  o: ({ fill }) => (
    <g fill={fill}>
      <rect x={2} y={0} width={5} height={1} />
      <rect x={2} y={6} width={5} height={1} />
      <rect x={1} y={1} width={2} height={5} />
      <rect x={6} y={1} width={2} height={5} />
    </g>
  ),
  p: ({ fill }) => (
    <g fill={fill}>
      <rect x={1} y={0} width={2} height={7} />
      <rect x={3} y={0} width={4} height={1} />
      <rect x={3} y={4} width={4} height={1} />
      <rect x={6} y={1} width={2} height={3} />
    </g>
  ),
  q: ({ fill }) => (
    <path
      fill={fill}
      d="M2,0 h5 v1 h1 v4 h-1 v1 h1 v1 h-1 v-1 h-2 v-1 h-1 v-1 h2 v-3 h-3 v5 h3 v1 h-4 v-1 h-1 v-5 h1 v-1"
    />
  ),
  r: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h6 v1 h1 v3 h-3 v-1 h1 v-2 h-3 v3 h3 v1 h1 v1 h1 v1 h-3 v-1 h-1 v-1 h-1 v2 h-2 v-7"
    />
  ),
  s: ({ fill }) => (
    <path
      fill={fill}
      d="M2,0 h4 v1 h1 v1 h-2 v-1 h-2 v2 h4 v1 h1 v2 h-1 v1 h-5 v-1 h-1 v-1 h2 v1 h3 v-2 h-4 v-1 h-1 v-2 h1 v-1"
    />
  ),
  t: ({ fill }) => (
    <g fill={fill}>
      <rect x={2} y={0} width={6} height={1} />
      <rect x={4} y={1} width={2} height={6} />
    </g>
  ),
  u: ({ fill }) => (
    <g fill={fill}>
      <rect x={1} y={0} width={2} height={6} />
      <rect x={6} y={0} width={2} height={6} />
      <rect x={2} y={6} width={5} height={1} />
    </g>
  ),
  v: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h2 v3 h1 v1 h1 v-1 h1 v-3 h2 v4 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-4"
    />
  ),
  w: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h2 v3 h1 v-1 h1 v1 h1 v-3 h2 v7 h-2 v-1 h-1 v-1 h-1 v1 h-1 v1 h-2 v-7"
    />
  ),
  x: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h2 v1 h1 v1 h1 v-1 h1 v-1 h2 v2 h-1 v1 h-1 v1 h1 v1 h1 v2 h-2 v-1 h-1 v-1 h-1 v1 h-1 v1 h-2 v-2 h1 v-1 h1 v-1 h-1 v-1 h-1 v-2"
    />
  ),
  y: ({ fill }) => (
    <path fill={fill} d="M2,0 h2 v3 h2 v-3 h2 v3 h-1 v1 h-1 v3 h-2 v-3 h-1 v-1 h-1 v-3" />
  ),
  z: ({ fill }) => (
    <path
      fill={fill}
      d="M1,0 h7 v2 h-1 v1 h-1 v1 h-1 v1 h-1 v1 h4 v1 h-7 v-2 h1 v-1 h1 v-1 h1 v-1 h1 v-1 h-4 v-1"
    />
  ),
  '-': ({ fill }) => <rect fill={fill} x="1" y="3" width="6" height="2" />,
  '+': ({ fill }) => (
    <g fill={fill}>
      <rect x="1" y="3" width="6" height="2" />
      <rect x="3" y="1" width="2" height="6" />
    </g>
  ),
  ':': ({ fill }) => (
    <g fill={fill}>
      <rect x="2" y="1" width="2" height="2" />
      <rect x="2" y="5" width="2" height="2" />
    </g>
  ),
  '.': ({ fill }) => <rect x="2" y="5" width="2" height="2" fill={fill} />,
  '/': ({ fill }) => (
    <path
      fill={fill}
      d="M5,0 h2 v1 h-1 v1 h-1 v2 h-1 v1 h-1 v1 h-1 v1 h-2 v-1 h1 v-1 h1 v-1 h1 v-2 h1 v-1 h1 z"
    />
  ),
  '?': ({ fill }) => (
    <g fill={fill}>
      <path d="M2,0 h5 v1 h1 v2 h-1 v1 h-1 v1 h-3 v-1 h2 v-1 h1 v-2 h-3 v2 h-2 v-2 h1 v-1" />
      <rect x="3" y="6" width="3" height="1" />
    </g>
  ),
  // 联机大厅要显示 hash 路由地址
  '#': ({ fill }) => (
    <g fill={fill}>
      <rect x="2" y="0" width="1" height="7" />
      <rect x="5" y="0" width="1" height="7" />
      <rect x="0" y="2" width="8" height="1" />
      <rect x="0" y="4" width="8" height="1" />
    </g>
  ),
  // Ⅰ 罗马数字 I
  ['Ⅰ'.toLowerCase()]: ({ fill }) => (
    <path fill={fill} d="M2,0 h4 v1 h-1 v5 h1 v1 h-4 v-1 h1 v-5 h-1 v-1" />
  ),
  // Ⅱ 罗马数字 II
  ['Ⅱ'.toLowerCase()]: ({ fill }) => (
    <g fill={fill}>
      <rect x={2} y={0} width={5} height={1} />
      <rect x={3} y={1} width={1} height={5} />
      <rect x={5} y={1} width={1} height={5} />
      <rect x={2} y={6} width={5} height={1} />
    </g>
  ),
  // ← 左箭头
  ['←'.toLowerCase()]: ({ fill }) => (
    <path
      fill={fill}
      d="M1,3 h1 v-1 h1 v-1 h1 v-1 h1 v2 h3 v3 h-3 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1"
    />
  ),
  // ↑ 上箭头
  ['↑'.toLowerCase()]: ({ fill }) => (
    <path
      fill={fill}
      transform="translate(8,-1) rotate(90)"
      d="M1,3 h1 v-1 h1 v-1 h1 v-1 h1 v2 h3 v3 h-3 v2 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1"
    />
  ),
  // → 右箭头
  ['→'.toLowerCase()]: ({ fill }) => (
    <path
      fill={fill}
      d="M1,2 h3 v-2 h1 v1 h1 v1 h1 v1 h1 v1 h-1 v1 h-1 v1 h-1 v1 h-1 v-2 h-3 v-3"
    />
  ),
  // ↓ 下箭头
  ['↓'.toLowerCase()]: ({ fill }) => (
    <path
      fill={fill}
      transform="translate(8,-1) rotate(90)"
      d="M1,2 h3 v-2 h1 v1 h1 v1 h1 v1 h1 v1 h-1 v1 h-1 v1 h-1 v1 h-1 v-2 h-3 v-3"
    />
  ),
  // © 版权符
  ['©'.toLowerCase()]: ({ fill }) => (
    <g fill={fill}>
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

interface Props {
  content: string
  x?: number
  y?: number
  fill?: string
  style?: CSSProperties
}

/** 以 8×8 像素位图字体渲染一行文本（不支持的字符渲染为空白） */
export default function PixelText({ content, x = 0, y = 0, fill = 'white', style }: Props) {
  return (
    <g className="pixel-text" transform={`translate(${x},${y})`} style={style}>
      {Array.from(content.toLowerCase()).map((char, i) => {
        const Component = chars[char] ?? chars[' ']
        return (
          <g key={i} transform={`translate(${8 * i},0)`}>
            <Component fill={fill} />
          </g>
        )
      })}
    </g>
  )
}

/** 文本像素宽度（每字符 8px） */
export function textWidth(content: string): number {
  return content.length * 8
}

/** 像素字体是否有该字符的字形 */
export function supportsChar(char: string): boolean {
  return char.length === 1 && char.toLowerCase() in chars
}

/** 按固定字符数折行的像素文本，行距 = 字高 + lineSpacing */
export function WrappedText({
  content,
  maxLength,
  x = 0,
  y = 0,
  fill,
  lineSpacing = 4,
}: {
  content: string
  maxLength: number
  x?: number
  y?: number
  fill?: string
  lineSpacing?: number
}) {
  const lines: string[] = []
  for (let i = 0; i < content.length; i += maxLength) {
    lines.push(content.slice(i, i + maxLength))
  }
  return (
    <g className="wrapped-text">
      {lines.map((line, i) => (
        <PixelText key={i} x={x} y={y + (8 + lineSpacing) * i} content={line} fill={fill} />
      ))}
    </g>
  )
}
