import { useState } from 'react'
import { BLOCK_SIZE as B } from '../../engine/constants'
import { BrickPatternDef, brickPatternFill } from '../pixel/BrickWall'
import HintText from '../pixel/HintText'
import PixelText from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import TankSvg from '../pixel/TankSvg'
import TextButton from '../pixel/TextButton'
import { formatScore } from '../formatScore'
import { keyLabel } from '../keyLabels'
import { useMenuKeys } from '../menuKeys'
import { MULTI_PLAYERS_SEARCH, push } from '../router'
import { useUIStore } from '../store'

const VERSION = `v${__APP_VERSION__}`

type Choice = 'single-player' | 'multi-players' | 'stage-list' | 'gallery' | 'options'
const CHOICES: Choice[] = ['single-player', 'multi-players', 'stage-list', 'gallery', 'options']
const CHOICE_LABELS: Record<Choice, string> = {
  'single-player': '1 player',
  'multi-players': '2 players',
  'stage-list': 'stage list',
  gallery: 'gallery',
  options: 'options',
}
/** 原版的四个菜单项 */
const MAIN_CHOICES = CHOICES.slice(0, 4)
// options 是重写版新增的，放在底部提示行里，不改动原版菜单的排版
const OPTIONS_X = 7 * B
const OPTIONS_Y = 14.5 * B

/** 标题页：忠实还原旧项目 GameTitleScene 的像素布局与内容。 */
export default function Title() {
  const onChoose = (c: Choice) => {
    if (c === 'single-player') push('/choose')
    else if (c === 'multi-players') push(`/choose${MULTI_PLAYERS_SEARCH}`)
    else if (c === 'stage-list') push('/list')
    else if (c === 'gallery') push('/gallery')
    else push('/options')
  }
  return (
    <Screen background="#000000">
      <TitleContent onChoose={onChoose} />
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
export function TitleContent({ onChoose }: { onChoose: (choice: Choice) => void }) {
  const control = useUIStore((s) => s.bindings.p1)
  const [choice, setChoice] = useState<Choice>('single-player')

  useMenuKeys((key) => {
    const index = CHOICES.indexOf(choice)
    if (key === 'down') {
      setChoice(CHOICES[(index + 1) % CHOICES.length])
    } else if (key === 'up') {
      setChoice(CHOICES[(index - 1 + CHOICES.length) % CHOICES.length])
    } else if (key === 'confirm') {
      onChoose(choice)
    }
  })

  const scale = 4
  return (
    <g className="game-title-scene">
      <BrickPatternDef scale={scale} />
      <rect fill="#000000" width={16 * B} height={15 * B} />
      <g transform="scale(0.5)">
        <TextButton
          textFill="#96d332"
          x={22 * B}
          y={B}
          content="star me on github"
          onClick={() => window.open('https://github.com/feichao93/battle-city')}
        />
      </g>
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
      {MAIN_CHOICES.map((c, i) => (
        <TextButton
          key={c}
          content={CHOICE_LABELS[c]}
          x={5.5 * B}
          y={(8 + i) * B}
          textFill="white"
          onMouseOver={() => setChoice(c)}
          onClick={() => onChoose(c)}
        />
      ))}
      {choice === 'options' ? (
        <g transform={`translate(${OPTIONS_X - 10}, ${OPTIONS_Y - 2}) scale(0.5)`}>
          <TankSvg side="player" level="basic" color="yellow" direction="right" x={0} y={0} />
        </g>
      ) : (
        <TankSvg
          side="player"
          level="basic"
          color="yellow"
          direction="right"
          x={4 * B}
          y={(7.75 + CHOICES.indexOf(choice)) * B}
        />
      )}
      <PixelText content={'© 1980 1985 NAMCO LTD.'} x={2 * B} y={12.5 * B} />
      <PixelText content="ALL RIGHTS RESERVED" x={3 * B} y={13.5 * B} />
      <HintText
        content={`${keyLabel(control.up)}/${keyLabel(control.down)} select  ${keyLabel(control.fire)} confirm`}
      />
      <g transform={`translate(${OPTIONS_X}, ${OPTIONS_Y}) scale(0.5)`}>
        <TextButton
          content={CHOICE_LABELS.options}
          textFill={choice === 'options' ? 'white' : '#999'}
          onMouseOver={() => setChoice('options')}
          onClick={() => onChoose('options')}
        />
      </g>
      <HintText content={VERSION} x={16 * B - 0.5 * B - VERSION.length * 4} />
    </g>
  )
}
