import { useEffect, useState } from 'react'
import { BLOCK_SIZE as B } from '../../engine/constants'
import { probeLan } from '../../lan/client'
import { BrickPatternDef, brickPatternFill } from '../pixel/BrickWall'
import { OverlayFrame, useOverlayKeys } from '../pixel/Overlay'
import PixelText, { textWidth } from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import TankSvg from '../pixel/TankSvg'
import TextButton from '../pixel/TextButton'
import useHelp from '../pixel/useHelp'
import { formatScore } from '../formatScore'
import { menuKeyOf, useMenuKeys } from '../menuKeys'
import { MULTI_PLAYERS_SEARCH, push } from '../router'
import { useUIStore } from '../store'

const VERSION = `v${__APP_VERSION__}`
const GITHUB_URL = 'https://github.com/feichao93/battle-city'

/**
 * 原版的四个菜单项；options 是重写版新增的，做成右下角的齿轮，不改动原版菜单。
 * lan 只在 `battle-city host` 起的服务上出现
 */
type Choice = 'single-player' | 'multi-players' | 'lan' | 'stage-list' | 'gallery'
const CHOICES: Choice[] = ['single-player', 'multi-players', 'stage-list', 'gallery']
const LAN_CHOICES: Choice[] = ['single-player', 'multi-players', 'lan', 'stage-list', 'gallery']
const CHOICE_LABELS: Record<Choice, string> = {
  'single-player': '1 player',
  'multi-players': '2 players',
  lan: 'lan battle',
  'stage-list': 'stage list',
  gallery: 'gallery',
}

/** 8×8 像素齿轮，# 是填色的像素 */
const GEAR = [
  '...##...',
  '.######.',
  '.######.',
  '###..###',
  '###..###',
  '.######.',
  '.######.',
  '...##...',
]

/** 右下角 ? 左边的齿轮按钮，点击进入 options */
function OptionsButton({ onClick }: { onClick: () => void }) {
  const x = 14 * B
  const y = 14.25 * B
  const spread = 0.05 * B
  return (
    <g className="text-button">
      <rect
        className="text-area"
        x={x - spread}
        y={y - spread}
        width={0.5 * B + 2 * spread}
        height={0.5 * B + 2 * spread}
        onClick={onClick}
      />
      <g transform={`translate(${x}, ${y})`} fill="#ccc" style={{ pointerEvents: 'none' }}>
        {GEAR.flatMap((line, row) =>
          [...line].map((c, col) =>
            c === '#' ? <rect key={`${row}-${col}`} x={col} y={row} width={1} height={1} /> : null,
          ),
        )}
      </g>
    </g>
  )
}

/** 点左下角版本号弹出的作者、版本信息 */
function AboutOverlay({ onClose }: { onClose: () => void }) {
  const first = 'this remake version is coded'
  const byline = 'by feichao93 on '
  return (
    <OverlayFrame title="about" width={textWidth(first)} height={80} onClose={onClose}>
      <PixelText x={0} y={0} content={first} />
      <PixelText x={0} y={12} content={byline} />
      <TextButton
        x={textWidth(byline)}
        y={12}
        content="github."
        stroke="#9ed046"
        onClick={() => window.open(GITHUB_URL)}
      />
      <PixelText x={0} y={36} content="welcome fork and star." />
      <PixelText x={0} y={60} fill="#999" content={`version ${__APP_VERSION__}`} />
      <PixelText x={0} y={72} fill="#999" content={`build ${__BUILD_TIME__}`} />
    </OverlayFrame>
  )
}

/** 标题页 */
export default function Title() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [lan, setLan] = useState(false)
  useEffect(() => {
    let active = true
    void probeLan().then((ok) => active && setLan(ok))
    return () => {
      active = false
    }
  }, [])
  useOverlayKeys(aboutOpen, () => setAboutOpen(false))
  const help = useHelp(
    [
      [
        {
          rows: [
            ['up/down', 'select'],
            ['fire', 'confirm'],
            ['o', 'options'],
          ],
        },
      ],
    ],
    !aboutOpen,
  )
  const bindings = useUIStore((s) => s.bindings)
  const onChoose = (c: Choice) => {
    if (c === 'single-player') push('/choose')
    else if (c === 'multi-players') push(`/choose${MULTI_PLAYERS_SEARCH}`)
    else if (c === 'lan') push('/lobby')
    else if (c === 'stage-list') push('/list')
    else push('/gallery')
  }
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // O 被改成了某个玩家的键位时让给键位
      if (e.code === 'KeyO' && !e.repeat && menuKeyOf(e.code, [bindings.p1, bindings.p2]) == null) {
        push('/options')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bindings])
  return (
    <Screen background="#000000">
      <TitleContent onChoose={onChoose} lan={lan} />
      <g transform={`translate(${0.5 * B}, ${14.5 * B}) scale(0.5)`}>
        <TextButton content={VERSION} textFill="#999" onClick={() => setAboutOpen(true)} />
      </g>
      <OptionsButton onClick={() => push('/options')} />
      {help.button}
      {help.overlay}
      {aboutOpen && <AboutOverlay onClose={() => setAboutOpen(false)} />}
    </Screen>
  )
}

/** 标题页顶部的上一局分数与最高分；上一局是双人时追加 Ⅱ 的分数 */
function ScoreLine() {
  const lastGame = useUIStore((s) => s.lastGame)
  const hiScore = useUIStore((s) => s.hiScore)
  const scores = lastGame?.scores ?? [0]
  let content = `Ⅰ-${formatScore(scores[0])} HI-${formatScore(hiScore)}`
  if (scores.length > 1) {
    content += ` Ⅱ-${formatScore(scores[1])}`
  }
  return <PixelText content={content} x={1 * B} y={1.5 * B} />
}

/** 标题画面内容（含菜单选择与键盘操作）；画廊的 title-scene 页复用 */
export function TitleContent({
  onChoose,
  lan = false,
}: {
  onChoose: (choice: Choice) => void
  lan?: boolean
}) {
  const [choice, setChoice] = useState<Choice>('single-player')
  const choices = lan ? LAN_CHOICES : CHOICES
  // 多出联机一项时收紧行距，不压到下面的版权行
  const rowHeight = lan ? 0.8 * B : B

  useMenuKeys((key) => {
    const index = choices.indexOf(choice)
    if (key === 'down') {
      setChoice(choices[(index + 1) % choices.length])
    } else if (key === 'up') {
      setChoice(choices[(index - 1 + choices.length) % choices.length])
    } else if (key === 'confirm') {
      onChoose(choice)
    }
  })

  const scale = 4
  return (
    <g className="game-title-scene">
      <BrickPatternDef scale={scale} />
      <rect fill="#000000" width={16 * B} height={15 * B} />
      <ScoreLine />
      <g transform={`scale(${scale})`}>
        <PixelText
          content="battle"
          x={(1.5 * B) / scale}
          y={(3 * B) / scale}
          fill={brickPatternFill(scale)}
        />
        <PixelText
          content="city"
          x={(3.5 * B) / scale + 1}
          y={(5.5 * B) / scale}
          fill={brickPatternFill(scale)}
        />
      </g>
      {choices.map((c, i) => (
        <TextButton
          key={c}
          content={CHOICE_LABELS[c]}
          x={5.5 * B}
          y={8 * B + i * rowHeight}
          textFill="white"
          onMouseOver={() => setChoice(c)}
          onClick={() => onChoose(c)}
        />
      ))}
      <TankSvg
        side="player"
        level="basic"
        color="yellow"
        direction="right"
        x={4 * B}
        y={7.75 * B + choices.indexOf(choice) * rowHeight}
      />
      <PixelText content={'© 1980 1985 NAMCO LTD.'} x={2 * B} y={12.5 * B} />
      <PixelText content="ALL RIGHTS RESERVED" x={3 * B} y={13.5 * B} />
    </g>
  )
}
