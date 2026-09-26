import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BLOCK_SIZE as B, FIELD_SIZE, TANK_LEVELS } from '../../engine/constants'
import FireDemo from '../../engine/FireDemo'
import StatisticsAnimation from '../../engine/StatisticsAnimation'
import type { TankColor, TankLevel, TankSide } from '../../engine/types'
import { drawExplosion, explosionSize } from '../../render/sprites/explosion'
import { drawFlicker } from '../../render/sprites/flicker'
import { drawPowerUp, POWER_UP_NAMES } from '../../render/sprites/powerup'
import { drawScore, SCORES } from '../../render/sprites/score'
import { renderTerrainLayers } from '../../render/stagePreview'
import { tankColor } from '../../render/tankColor'
import { HudContent } from '../BattleOverlay'
import Grid from '../editor/Grid'
import PixelText, { WrappedText } from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import SpriteImage from '../pixel/SpriteImage'
import TankSvg from '../pixel/TankSvg'
import TextButton from '../pixel/TextButton'
import { keyLabel } from '../keyLabels'
import { useMenuKeys } from '../menuKeys'
import { GALLERY_TABS, goBack, replace, type GalleryTab } from '../router'
import { useUIStore, type LastGame } from '../store'
import { StatisticsContent } from '../StatisticsScene'
import useAnimationTime from '../useAnimationTime'
import { GameoverContent } from './GameOver'
import { TitleContent } from './Title'

function Transform({
  x = 0,
  y = 0,
  k = 1,
  children,
}: {
  x?: number
  y?: number
  k?: number
  children: ReactNode
}) {
  return <g transform={`translate(${x}, ${y}) scale(${k})`}>{children}</g>
}

function TabTitle({ content }: { content: string }) {
  return <PixelText x={8} y={8} content={content} fill="#dd2664" />
}

function GrayText(props: { content: string; x?: number; y?: number }) {
  return <PixelText fill="#ccc" {...props} />
}

interface X2TankProps {
  x: number
  side: TankSide
  level: TankLevel
  color: TankColor
  hp?: number
  withPowerUp?: boolean
  time: number
}

/** 放大 2 倍的坦克；bot 颜色按对局中的变色规则闪烁 */
function X2Tank({ x, side, level, color, hp = 1, withPowerUp = false, time }: X2TankProps) {
  const shown = tankColor({ side, level, color, hp, withPowerUp, bornAt: 0 }, time)
  return (
    <Transform x={x} k={2}>
      <TankSvg x={0} y={0} side={side} level={level} color={shown} />
    </Transform>
  )
}

function TanksTab() {
  const time = useAnimationTime()
  const row = (props: Omit<X2TankProps, 'x' | 'level' | 'time'>) =>
    TANK_LEVELS.map((level, i) => (
      <X2Tank key={i} x={48 * i} level={level} time={time} {...props} />
    ))
  return (
    <g>
      <TabTitle content="tanks" />
      <Transform y={32}>
        <GrayText x={8} y={8} content="player" />
        <GrayText x={8} y={20} content="tanks" />
        <Transform x={64}>{row({ side: 'player', color: 'yellow' })}</Transform>
      </Transform>
      <Transform y={80}>
        <GrayText x={8} y={8} content="bot" />
        <GrayText x={8} y={20} content="tanks" />
        <Transform x={64}>{row({ side: 'bot', color: 'silver' })}</Transform>
      </Transform>
      <Transform y={128}>
        <GrayText x={8} y={0} content="armor" />
        <GrayText x={8} y={12} content="tank" />
        <GrayText x={8} y={24} content="hp 1-4" />
        <Transform x={64}>
          {[1, 2, 3, 4].map((hp, i) => (
            <X2Tank
              key={hp}
              x={48 * i}
              side="bot"
              level="armor"
              color="silver"
              hp={hp}
              time={time}
            />
          ))}
        </Transform>
      </Transform>
      <Transform y={176}>
        <GrayText x={8} y={0} content="tank" />
        <GrayText x={8} y={12} content="with" />
        <GrayText x={8} y={24} content="powerup" />
        <Transform x={64}>{row({ side: 'bot', color: 'silver', withPowerUp: true })}</Transform>
      </Transform>
    </g>
  )
}

function TextsTab() {
  return (
    <g>
      <TabTitle content="Texts" />
      <Transform x={8} y={64} k={2}>
        <PixelText x={0} y={0} content="abcdefg" fill="#feac4e" />
        <PixelText x={64} y={0} content="hijklmn" fill="#feac4e" />
        <PixelText x={0} y={12} content="opq rst" fill="#feac4e" />
        <PixelText x={64} y={12} content="uvw xyz" fill="#feac4e" />
        <PixelText x={0} y={24} content="Ⅰ Ⅱ ←-→" fill="#feac4e" />
        <PixelText x={62} y={24} content={':+- .©?'} fill="#feac4e" />
      </Transform>
    </g>
  )
}

function MiscTab() {
  return (
    <g>
      <TabTitle content="misc" />
      <Transform x={16} y={32}>
        <GrayText content="HUD" />
        <Transform k={0.5} y={10}>
          <GrayText content="head up display" />
        </Transform>
        <Transform y={16}>
          <rect width={16 + 4} height={128 + 4} fill="#757575" />
          <HudContent remainingBots={17} lives={[3, 1]} autopilot={[false, true]} />
        </Transform>
      </Transform>
      <Transform x={96} y={32}>
        <GrayText content="powerups" />
        <Transform y={16} k={1.5}>
          {POWER_UP_NAMES.map((name, i) => (
            <SpriteImage
              key={name}
              id={`powerup/${name}`}
              size={16}
              paint={(ctx) => drawPowerUp(ctx, name)}
              y={16 * i}
            />
          ))}
        </Transform>
      </Transform>
      <Transform x={176} y={32}>
        <GrayText content="scores" />
        <Transform y={16} k={1.5}>
          {SCORES.map((score, i) => (
            <SpriteImage
              key={score}
              id={`score/${score}`}
              size={16}
              paint={(ctx) => drawScore(ctx, score)}
              y={16 * i}
            />
          ))}
        </Transform>
      </Transform>
    </g>
  )
}

function TitleSceneTab() {
  return (
    <g>
      <TabTitle content="title-scene" />
      <Transform k={0.8} x={25} y={32}>
        <TitleContent onChoose={() => {}} />
      </Transform>
    </g>
  )
}

const GALLERY_KILL_INFO: Record<TankLevel, number>[] = [
  { basic: 10, fast: 4, power: 0, armor: 1 },
  { basic: 4, fast: 0, power: 2, armor: 1 },
]

function StatisticsTab() {
  const [animation] = useState(
    () => new StatisticsAnimation('gallery', GALLERY_KILL_INFO, [false, true]),
  )
  const time = useAnimationTime()
  const lastTimeRef = useRef(0)
  useEffect(() => {
    animation.advance(time - lastTimeRef.current)
    lastTimeRef.current = time
  }, [animation, time])
  return (
    <g>
      <TabTitle content="Statistics" />
      <Transform k={0.8} x={25} y={32}>
        <StatisticsContent view={animation.view} scores={[1000, 12345]} />
      </Transform>
    </g>
  )
}

const SAMPLE_GAMEOVER: LastGame = {
  stageName: '12',
  scores: [12300, 4500],
  cleared: false,
  newHiScore: false,
  aiOnly: false,
  autopilot: [false, true],
}
const SAMPLE_CLEARED: LastGame = {
  stageName: '35',
  scores: [23400],
  cleared: true,
  newHiScore: true,
  aiOnly: false,
  autopilot: [false],
}

function GameoverTab() {
  return (
    <g>
      <TabTitle content="gameover" />
      <Transform k={0.45} x={8} y={48}>
        <GameoverContent result={SAMPLE_GAMEOVER} hiScore={20000} />
      </Transform>
      <Transform k={0.45} x={132} y={48}>
        <GameoverContent result={SAMPLE_CLEARED} hiScore={23400} />
      </Transform>
    </g>
  )
}

function InfoTab() {
  return (
    <g>
      <TabTitle content="info" />
      <Transform y={64}>
        <WrappedText
          x={8}
          y={0}
          maxLength={28}
          content="This remake version is codedby feichao93 on github."
        />
        <TextButton
          x={8 + 16 * 8}
          y={12}
          content="github."
          onClick={() => window.open('https://github.com/feichao93/battle-city')}
          stroke="#9ed046"
        />
        <WrappedText x={8} y={40} maxLength={28} content="Welcome fork and star." />
        <PixelText x={8} y={72} fill="#999" content={`version ${__APP_VERSION__}`} />
        <PixelText x={8} y={84} fill="#999" content={`build ${__BUILD_TIME__}`} />
      </Transform>
    </g>
  )
}

/** 演示两条车道：上道击毁 bot，下道子弹穿过河 / 森林 / 雪地后打在砖墙上 */
function FireTab() {
  const [demo] = useState(() => new FireDemo())
  const [paused, setPaused] = useState(false)
  const fire = useUIStore((s) => s.bindings.p1.fire)
  const time = useAnimationTime()
  const lastTimeRef = useRef(0)
  useEffect(() => {
    demo.step(time - lastTimeRef.current)
    lastTimeRef.current = time
  }, [demo, time])
  // Esc 在画廊里统一用于返回，暂停演示改用确认键
  useMenuKeys((key) => {
    if (key === 'confirm') {
      demo.paused = !demo.paused
      setPaused(demo.paused)
    }
  })
  const terrain = useMemo(() => renderTerrainLayers(demo.map), [demo, demo.map.version])

  return (
    <g>
      <TabTitle content="fire" />
      <Transform x={16} y={40} k={2}>
        <defs>
          <clipPath id="fire-demo">
            <rect width={112} height={32} />
            <rect y={48} width={112} height={32} />
          </clipPath>
        </defs>
        <g clipPath="url(#fire-demo)">
          <rect width={FIELD_SIZE} height={FIELD_SIZE} fill="#000000" />
          <image href={terrain.ground} width={FIELD_SIZE} height={FIELD_SIZE} />
          {demo.bullets.map((b) => (
            <rect key={b.bulletId} x={b.x} y={b.y} width={3} height={3} fill="#ADADAD" />
          ))}
          {demo.tanks.map((t) => (
            <TankSvg
              key={t.tankId}
              x={t.x}
              y={t.y}
              side={t.side}
              level={t.level}
              color={tankColor(t, demo.time)}
              direction={t.direction}
            />
          ))}
          <image href={terrain.forest} width={FIELD_SIZE} height={FIELD_SIZE} />
          {demo.explosions.map((e) => {
            const shape = e.shape()
            const size = explosionSize(shape)
            return (
              <SpriteImage
                key={e.id}
                id={`explosion/${shape}`}
                size={size}
                paint={(ctx) => drawExplosion(ctx, shape)}
                x={e.cx - size / 2}
                y={e.cy - size / 2}
              />
            )
          })}
          {demo.flickers.map((fl) => {
            const shape = fl.shape()
            return (
              <SpriteImage
                key={fl.id}
                id={`flicker/${shape}`}
                size={16}
                paint={(ctx) => drawFlicker(ctx, shape)}
                x={fl.x}
                y={fl.y}
              />
            )
          })}
        </g>
      </Transform>
      {paused && (
        <Transform x={16} y={40}>
          <PixelText content="paused" fill="#db2b00" />
          <PixelText y={6 * B} content="paused" fill="#db2b00" />
        </Transform>
      )}
      <Transform x={0.5 * B} y={13.5 * B} k={0.5}>
        <PixelText fill="#999" content={`Hint: Press ${keyLabel(fire)} to pause`} />
      </Transform>
    </g>
  )
}

const TAB_CONTENT: Record<GalleryTab, () => ReactNode> = {
  tanks: TanksTab,
  texts: TextsTab,
  fire: FireTab,
  misc: MiscTab,
  'title-scene': TitleSceneTab,
  statistics: StatisticsTab,
  gameover: GameoverTab,
  info: InfoTab,
}

/** 底部导航各 tab 名称的横坐标（原版手工排版） */
const NAV_X: Record<GalleryTab, number> = {
  tanks: 0,
  texts: 3 * B,
  fire: 6 * B,
  misc: 8.5 * B,
  'title-scene': 11 * B,
  statistics: 17 * B,
  gameover: 22.5 * B,
  info: 27 * B,
}

/** 画廊：还原原版 Gallery，逐页展示游戏中的各类元素 */
export default function Gallery({ tab }: { tab: GalleryTab }) {
  const index = GALLERY_TABS.indexOf(tab)
  const Content = TAB_CONTENT[tab]
  const choose = (next: GalleryTab) => replace(`/gallery/${next}`)
  useMenuKeys((key) => {
    if (key === 'left' && index > 0) choose(GALLERY_TABS[index - 1])
    else if (key === 'right' && index < GALLERY_TABS.length - 1) choose(GALLERY_TABS[index + 1])
    else if (key === 'back') goBack()
  })
  return (
    <Screen background="#333">
      <Grid />
      <g transform={`translate(${8 * B}, 8)`}>
        <TextButton
          x={0}
          content="prev"
          onClick={() => choose(GALLERY_TABS[index - 1])}
          disabled={index === 0}
        />
        <TextButton
          x={2.5 * B}
          content="next"
          onClick={() => choose(GALLERY_TABS[index + 1])}
          disabled={index === GALLERY_TABS.length - 1}
        />
        <TextButton x={5 * B} content="back" onClick={goBack} />
      </g>
      <Content key={tab} />
      <g transform={`translate(${0.5 * B}, ${14.5 * B}) scale(0.5)`}>
        {GALLERY_TABS.map((t) => (
          <TextButton
            key={t}
            x={NAV_X[t]}
            content={t}
            textFill={t === tab ? '#999' : '#444'}
            onClick={() => choose(t)}
          />
        ))}
      </g>
    </Screen>
  )
}
