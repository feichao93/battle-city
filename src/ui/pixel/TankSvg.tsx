import type { ReactNode } from 'react'
import { BLOCK_SIZE, TANK_COLOR_SCHEMES } from '../../engine/constants'
import type { Direction, TankSide as Side, TankColor, TankLevel } from '../../engine/types'

// 坦克像素 SVG（静态版，不含动画 Timing）。

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

type Scheme = { a: string; b: string; c: string }

function Pixel({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <rect x={x} y={y} width={1} height={1} fill={fill} />
}

/** 由字符串行点阵 + scheme 渲染像素块（每字符对应 scheme[char]） */
function Bitmap({ x, y, d, scheme }: { x: number; y: number; d: string[]; scheme: Scheme }) {
  const width = d[0].length
  return (
    <g transform={`translate(${x},${y})`}>
      {d.flatMap((cs, dy) =>
        Array.from(cs).map((c, dx) => (
          <Pixel key={dy * width + dx} x={dx} y={dy} fill={(scheme as Record<string, string>)[c]} />
        )),
      )}
    </g>
  )
}

interface TankBodyProps {
  color: TankColor
  shape: 0 | 1
}

const BasicPlayerTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={5} width={3} height={9} fill={a} />
        <rect x={2} y={5} width={1} height={9} fill={b} />
        {shape === 0 ? (
          <g>
            <Bitmap x={1} y={4} d={['abb']} scheme={scheme} />
            <Bitmap x={1} y={14} d={['abb']} scheme={scheme} />
            {range(5).map((i) => (
              <rect key={i} x={1} width={2} y={5 + 2 * i} height={1} fill={c} />
            ))}
          </g>
        ) : (
          <g>
            <Bitmap x={1} y={4} d={['acc']} scheme={scheme} />
            <Bitmap x={1} y={14} d={['bcc']} scheme={scheme} />
            {range(4).map((i) => (
              <rect key={i} x={1} width={2} y={6 + 2 * i} height={1} fill={c} />
            ))}
          </g>
        )}
      </g>
      <g className="right-tire">
        <rect x={11} y={4} width={3} height={11} fill={c} />
        <Pixel x={11} y={4} fill={a} />
        {shape === 0
          ? range(6).map((i) => <rect key={i} x={12} width={2} y={4 + 2 * i} height={1} fill={b} />)
          : range(5).map((i) => (
              <rect key={i} x={12} width={2} y={5 + 2 * i} height={1} fill={b} />
            ))}
      </g>
      <g className="tank-body">
        <path d="M4,7 h1 v-1 h1 v2 h-1 v3 h1 v1 h1 v1 h-2 v-1 h-1 v-5" fill={a} />
        <Pixel x={4} y={12} fill={c} />
        <path d="M6,6 h1 v1 h3 v1 h1 v4 h-1 v1 h-3 v-1 h-1 v-1 h-1 v-3 h1 v-2" fill={b} />
        <Pixel x={10} y={12} fill={c} />
        <rect x={5} y={13} width={5} height={1} fill={c} />
        <rect x={8} width={2} y={6} height={1} fill={c} />
        <Pixel x={10} y={7} fill={c} />
        <path d="M6,8 h2 v1 h-1 v2 h-1 v-3" fill={a} />
        <path d="M8,9 h1 v3 h-2 v-1 h1 v-2" fill={c} />
      </g>
      <rect x={7} y={2} width={1} height={5} fill={a} />
    </g>
  )
}

const FastPlayerTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={5} width={3} height={11} fill={a} />
        <rect x={2} y={5} width={2} height={11} fill={b} />
        <Pixel x={3} y={5} fill={a} />
        <Pixel x={3} y={14} fill={a} />
        {shape === 0 ? (
          <g>
            <Bitmap x={1} y={4} d={['abb']} scheme={scheme} />
            <Bitmap x={1} y={15} d={['ccc']} scheme={scheme} />
            {range(5).map((i) => (
              <rect key={i} x={1} width={2} y={5 + 2 * i} height={1} fill={c} />
            ))}
          </g>
        ) : (
          <g>
            <Bitmap x={1} y={4} d={['bcc']} scheme={scheme} />
            <Bitmap x={1} y={15} d={['abb']} scheme={scheme} />
            {range(5).map((i) => (
              <rect key={i} x={1} width={2} y={6 + 2 * i} height={1} fill={c} />
            ))}
          </g>
        )}
      </g>
      <g className="right-tire">
        <rect x={11} y={4} width={3} height={12} fill={c} />
        <Pixel x={11} y={4} fill={a} />
        {shape === 0 ? (
          range(6).map((i) => <rect key={i} x={12} width={2} y={4 + 2 * i} height={1} fill={b} />)
        ) : (
          <g>
            {range(6).map((i) => (
              <rect key={i} x={12} width={2} y={5 + 2 * i} height={1} fill={b} />
            ))}
            <Pixel x={11} y={15} fill={b} />
          </g>
        )}
      </g>
      <g className="tank-body">
        <path d="M4,5 h2 v3 h-1 v5 h1 v1 h-2 v-9" fill={a} />
        <rect x={6} y={4} width={1} height={2} fill={c} />
        <path d="M8,4 h1 v1 h2 v10 h-7 v-1 h5 v-1 h1 v-5 h-1 v-2 h-1 v-2" fill={c} />
        <path d="M6,6 h1 v1 h1 v-1 h1 v2 h1 v5 h-1 v1 h-3 v-1 h-1 v-5 h1 v-2" fill={b} />
        <path d="M6,8 h2 v1 h-1 v3 h-1 v-4" fill={a} />
        <path d="M8,9 h1 v4 h-2 v-1 h1 v-3" fill={c} />
      </g>
      <rect x={7} y={0} width={1} height={7} fill={a} />
    </g>
  )
}

const PowerPlayerTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={3} width={1} height={12} fill={a} />
        <rect x={2} y={3} width={2} height={12} fill={b} />
        {shape === 0 ? (
          <g>
            <Bitmap x={1} y={3} d={['bcc']} scheme={scheme} />
            {range(5).map((i) => (
              <rect key={i} x={1} width={1} y={5 + 2 * i} height={1} fill={c} />
            ))}
          </g>
        ) : (
          <g>
            <Bitmap x={1} y={3} d={['aaa']} scheme={scheme} />
            {range(5).map((i) => (
              <rect key={i} x={1} width={1} y={4 + 2 * i} height={1} fill={c} />
            ))}
          </g>
        )}
      </g>
      <g className="right-tire">
        <rect x={11} y={3} width={3} height={12} fill={c} />
        {shape === 0 ? (
          <g>
            <Bitmap x={11} y={3} d={['a']} scheme={scheme} />
            {range(6).map((i) => (
              <rect key={i} x={13} width={1} y={4 + 2 * i} height={1} fill={b} />
            ))}
          </g>
        ) : (
          <g>
            <Bitmap x={11} y={3} d={['ab']} scheme={scheme} />
            {range(6).map((i) => (
              <rect key={i} x={13} width={1} y={3 + 2 * i} height={1} fill={b} />
            ))}
          </g>
        )}
      </g>
      <g className="tank-body">
        <path d="M3,5 h2 v1 h-1 v5 h1 v1 h1 v1 h-2 v-1 h-1 v-7" fill={a} />
        <Pixel x={4} y={4} fill={c} />
        <rect x={5} y={3} width={1} height={2} fill={a} />
        <rect x={6} y={3} width={1} height={2} fill={c} />
        <path d="M8,3 h2 v1 h1 v2 h-1 v-1 h-2 v-2" fill={c} />
        <path d="M10,11 h1 v3 h-7 v-1 h5 v-1 h1 v-1 h1" fill={c} />
        <path d="M5,5 h5 v1 h1 v5 h-1 v1 h-1 v1 h-3 v-1 h-1 v-1 h-1 v-5 h1 v-1" fill={b} />
        <path d="M6,6 h2 v1 h-1 v4 h-1 v-5" fill={a} />
        <path d="M8,7 h1 v5 h-2 v-1 h1 v-4" fill={c} />
      </g>
      <g className="gun">
        <path d="M6,0 h3 v2 h-1 v3 h-1 v-3 h-1 v-2" fill={a} />
        <path d="M8,0 h1 v2 h-2 v-1 h1 v-1" fill={b} />
      </g>
    </g>
  )
}

const ArmorPlayerTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={1} width={1} height={14} fill={a} />
        <rect x={2} y={1} width={2} height={14} fill={b} />
        {shape === 0 ? (
          <g>
            {range(7).map((i) => (
              <rect key={i} x={1} y={2 * i + 2} width={1} height={1} fill={c} />
            ))}
            <rect x={2} y={14} width={2} height={1} fill={c} />
          </g>
        ) : (
          <g>
            <Bitmap x={1} y={1} d={['bcc']} scheme={scheme} />
            {range(6).map((i) => (
              <rect key={i} x={1} y={2 * i + 3} width={1} height={1} fill={c} />
            ))}
          </g>
        )}
      </g>
      <g className="right-tire">
        <rect x={12} y={1} width={3} height={14} fill={b} />
        <Pixel x={12} y={1} fill={a} />
        {shape === 0 ? (
          <g>
            {range(6).map((i) => (
              <rect key={i} x={14} y={2 * i + 2} width={1} height={1} fill={c} />
            ))}
            <rect x={13} y={14} width={2} height={1} fill={c} />
          </g>
        ) : (
          <g>
            {range(7).map((i) => (
              <rect key={i} x={14} y={2 * i + 1} width={1} height={1} fill={c} />
            ))}
            <Pixel x={13} y={1} fill={c} />
          </g>
        )}
      </g>
      <g className="tank-body">
        <path d="M4,2 h3 v-2 h2 v2 h3 v3 h-1 v7 h-7 v-10" fill={b} />
        <path d="M3,2 h3 v3 h1 v-5 h1 v6 h-3 v6 h-1 v-9 h-1 v-1" fill={a} />
        <rect x={9} y={2} width={1} height={3} fill={c} />
        <path d="M6,7 h3 v1 h-2 v2 h-1 v-3" fill={a} />
        <path d="M9,8 h1 v3 h-3 v-1 h2 v-2" fill={c} />
        <path d="M12,3 h1 v10 h-1 v-1 h-1 v-7 h1 v-2" fill={c} />
        <path d="M4,12 h7 v1 h1 v1 h-9 v-1 h1 v-1" fill={c} />
        <Pixel x={11} y={12} fill={b} />
        <Pixel x={12} y={13} fill={b} />
        <Pixel x={13} y={2} fill={c} />
        <Pixel x={12} y={14} fill={c} />
        <Pixel x={13} y={13} fill={c} />
      </g>
    </g>
  )
}

const BasicBotTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={3} width={1} height={11} fill={a} />
        <rect x={2} y={3} width={2} height={11} fill={b} />
        {shape === 0 ? (
          range(5).map((i) => <rect key={i} x={1} y={2 * i + 4} width={2} height={1} fill={c} />)
        ) : (
          <g>
            <Bitmap x={1} y={3} d={['bcc']} scheme={scheme} />
            {range(5).map((i) => (
              <rect key={i} x={1} y={2 * i + 5} width={2} height={1} fill={c} />
            ))}
          </g>
        )}
      </g>
      <g className="right-tire">
        <rect x={11} y={3} width={3} height={11} fill={b} />
        <Pixel x={11} y={3} fill={a} />
        {shape === 0 ? (
          <g>
            {range(5).map((i) => (
              <rect key={i} x={12} y={2 * i + 4} width={2} height={1} fill={c} />
            ))}
            <Pixel x={7} y={14} fill={b} />
          </g>
        ) : (
          <g>
            {range(6).map((i) => (
              <rect key={i} x={12} y={2 * i + 3} width={2} height={1} fill={c} />
            ))}
            <Pixel x={7} y={14} fill={c} />
          </g>
        )}
      </g>
      <g className="tank-body">
        <path d="M5,4 h1 v3 h-1 v4 h1 v2 h-1 v-1 h-1 v-7 h1 v-1" fill={a} />
        <path
          d="M8,3 h1 v1 h1 v1 h1 v7 h-1 v1 h-1 v1 h-3 v-1 h2 v-1 h1 v-1 h1 v-4 h-1 v-1 h-1 v-3"
          fill={c}
        />
        <path d="M6,3 h1 v3 h2 v1 h1 v4 h-1 v1 h-1 v1 h-2 v-2 h-1 v-4 h1 v-4" fill={b} />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
      <rect x={7} y={0} width={1} height={6} fill={a} />
    </g>
  )
}

const FastBotTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={2} width={2} height={3} fill={c} />
        <rect x={1} y={7} width={2} height={3} fill={c} />
        <rect x={1} y={12} width={2} height={3} fill={c} />
        {shape === 0
          ? range(3).map((i) => <rect key={i} x={1} y={5 * i + 2} width={1} height={1} fill={b} />)
          : range(3).map((i) => <rect key={i} x={1} y={5 * i + 3} width={1} height={1} fill={b} />)}
      </g>
      <g className="right-tire">
        <rect x={12} y={2} width={2} height={3} fill={c} />
        <rect x={12} y={7} width={2} height={3} fill={c} />
        <rect x={12} y={12} width={2} height={3} fill={c} />
        {shape === 0 ? (
          <g>
            {range(3).map((i) => (
              <rect key={i} x={12} y={5 * i + 2} width={1} height={1} fill={b} />
            ))}
            <Pixel x={7} y={14} fill={a} />
          </g>
        ) : (
          <g>
            {range(3).map((i) => (
              <rect key={i} x={12} y={5 * i + 3} width={1} height={1} fill={b} />
            ))}
            <Pixel x={7} y={14} fill={b} />
          </g>
        )}
      </g>
      <g className="tank-body">
        <path d="M4,2 h2 v4 h-1 v5 h1 v1 h3 v1 h-5 v1 h-1 v-11 h1 v-1" fill={a} />
        <Pixel x={9} y={11} fill={a} />
        <path d="M3,4 h1 v1 h1 v1 h-1 v6 h2 v1 h-2 v1 h-1 v-10" fill={b} />
        <rect x={6} y={2} width={1} height={3} fill={c} />
        <path d="M8,2 h1 v2 h2 v11 h-3 v-1 h-1 v1 h-3 v-2 h5 v-1 h1 v-6 h-1 v-1 h-1 v-3" fill={c} />
        <rect x={9} y={2} height={2} width={2} fill={b} />
        <rect x={11} y={3} height={11} width={1} fill={b} />
        <path d="M6,5 h1 v1 h1 v-1 h1 v1 h1 v5 h-1 v1 h-3 v-1 h-1 v-5 h1 v-1" fill={b} />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
      <rect x={7} y={0} width={1} height={6} fill={a} />
    </g>
  )
}

const PowerBotTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={3} width={1} height={12} fill={a} />
        <rect x={2} y={3} width={2} height={12} fill={b} />
        {shape === 0 ? (
          range(6).map((i) => <rect key={i} x={1} y={2 * i + 4} width={2} height={1} fill={c} />)
        ) : (
          <g>
            <Bitmap x={1} y={3} d={['bcc']} scheme={scheme} />
            {range(5).map((i) => (
              <rect key={i} x={1} y={2 * i + 5} width={2} height={1} fill={c} />
            ))}
          </g>
        )}
      </g>
      <g className="right-tire">
        <rect x={11} y={3} width={3} height={12} fill={b} />
        <Pixel x={11} y={3} fill={a} />
        {shape === 0 ? (
          <g>
            {range(6).map((i) => (
              <rect key={i} x={12} y={2 * i + 4} width={2} height={1} fill={c} />
            ))}
            <Pixel x={7} y={14} fill={a} />
          </g>
        ) : (
          <g>
            {range(6).map((i) => (
              <rect key={i} x={12} y={2 * i + 3} width={2} height={1} fill={c} />
            ))}
            <Pixel x={7} y={14} fill={b} />
          </g>
        )}
      </g>
      <g className="tank-body">
        <path d="M5,4 h1 v3 h-1 v4 h1 v1 h1 v2 h-2 v-2 h-1 v-7 h1 v-1" fill={a} />
        <Pixel x={6} y={14} fill={b} />
        <path d="M6,3 h1 v3 h2 v1 h1 v4 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-4 h1 v-4" fill={b} />
        <path
          d="M8,3 h1 v1 h1 v1 h1 v7 h-1 v2 h-1 v1 h-1 v-1 h-1 v-1 h1 v-1 h1 v-1 h1 v-4 h-1 v-1 h-1 v-3"
          fill={c}
        />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
      <g className="gun">
        <path d="M6,0 h2 v6 h-1 v-5 h-1 v-1" fill={a} />
        <Pixel x={8} y={0} fill={b} />
      </g>
    </g>
  )
}

const ArmorBotTank = ({ color, shape }: TankBodyProps) => {
  const scheme = TANK_COLOR_SCHEMES[color]
  const { a, b, c } = scheme
  return (
    <g>
      <g className="left-tire">
        <rect x={1} y={0} width={1} height={15} fill={a} />
        <rect x={2} y={0} width={2} height={15} fill={b} />
        {shape === 0 ? (
          range(7).map((i) => <rect key={i} x={1} y={2 * i + 1} width={2} height={1} fill={c} />)
        ) : (
          <g>
            <Bitmap x={1} y={0} d={['bc']} scheme={scheme} />
            {range(7).map((i) => (
              <rect key={i} x={1} y={2 * i + 2} width={2} height={1} fill={c} />
            ))}
          </g>
        )}
      </g>
      <g className="right-tire">
        <rect x={11} y={0} width={3} height={15} fill={b} />
        <Pixel x={11} y={0} fill={a} />
        <Pixel x={11} y={14} fill={c} />
        {shape === 0 ? (
          <g>
            {range(7).map((i) => (
              <rect key={i} x={12} y={2 * i + 1} width={2} height={1} fill={c} />
            ))}
            <Pixel x={7} y={14} fill={b} />
          </g>
        ) : (
          <g>
            {range(8).map((i) => (
              <rect key={i} x={12} y={2 * i} width={2} height={1} fill={c} />
            ))}
            <Pixel x={7} y={14} fill={a} />
          </g>
        )}
      </g>
      <g className="tank-body">
        <path d="M4,1 h2 v-1 h3 v1 h2 v4 h-1 v7 h-5 v1 h-1 v-12" fill={b} />
        <path d="M6,0 h2 v6 h1 v-2 h1 v3 h-5 v5 h-1 v-9 h1 v2 h1 v1 h1 v-4 h-1 v-2" fill={a} />
        <Pixel x={5} y={1} fill={c} />
        <Pixel x={9} y={1} fill={c} />
        <rect x={8} y={2} width={1} height={4} fill={c} />
        <path d="M11,3 h1 v10 h-1 v-1 h-1 v-7 h1 v-2" fill={c} />
        <path d="M4,13 h1 v-1 h5 v1 h1 v1 h-7 v-1" fill={c} />
        <Pixel x={10} y={12} fill={b} />
        <path d="M7,7 h1 v2 h-1 v1 h-1 v-2 h1 v-1" fill={c} />
        <path d="M8,8 h1 v2 h-2 v-1 h1 v-1" fill={a} />
      </g>
    </g>
  )
}

function resolveTankComponent(side: Side, level: TankLevel) {
  if (side === 'player') {
    if (level === 'basic') return BasicPlayerTank
    if (level === 'fast') return FastPlayerTank
    if (level === 'power') return PowerPlayerTank
    return ArmorPlayerTank
  }
  if (level === 'basic') return BasicBotTank
  if (level === 'fast') return FastBotTank
  if (level === 'power') return PowerBotTank
  return ArmorBotTank
}

/** 按朝向计算坦克 16×16 sprite 的平移 + 旋转（坦克本体始终朝上绘制） */
function tankTransform(x: number, y: number, direction: Direction): string {
  let dx: number
  let dy: number
  let rotate: number
  if (direction === 'up') {
    dx = x
    dy = y
    rotate = 0
  } else if (direction === 'down') {
    dx = x + BLOCK_SIZE - 1
    dy = y + BLOCK_SIZE
    rotate = 180
  } else if (direction === 'left') {
    dx = x
    dy = y + BLOCK_SIZE - 1
    rotate = -90
  } else {
    dx = x + BLOCK_SIZE
    dy = y
    rotate = 90
  }
  return `translate(${dx}, ${dy}) rotate(${rotate})`
}

interface TankSvgProps {
  x: number
  y: number
  side: Side
  level?: TankLevel
  color: TankColor
  direction?: Direction
  shape?: 0 | 1
}

/** 渲染一辆静态坦克（用于标题光标 / 统计 / 画廊）。 */
export default function TankSvg({
  x,
  y,
  side,
  level = 'basic',
  color,
  direction = 'up',
  shape = 0,
}: TankSvgProps): ReactNode {
  const Body = resolveTankComponent(side, level)
  return (
    <g transform={tankTransform(x, y, direction)}>
      <Body color={color} shape={shape} />
    </g>
  )
}
