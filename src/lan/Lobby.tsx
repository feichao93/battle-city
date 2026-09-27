import { useEffect, useRef, useState } from 'react'
import { BLOCK_SIZE as B, FIELD_SIZE } from '../engine/constants'
import type { RawStageConfig } from '../engine/types'
import { stages } from '../stages'
import { formatScore } from '../ui/formatScore'
import { useMenuKeys } from '../ui/menuKeys'
import FocusFrame from '../ui/pixel/FocusFrame'
import PixelText from '../ui/pixel/PixelText'
import Screen from '../ui/pixel/Screen'
import StagePreview from '../ui/pixel/StagePreview'
import TextButton from '../ui/pixel/TextButton'
import TextInput from '../ui/pixel/TextInput'
import useBlink from '../ui/pixel/useBlink'
import useHelp from '../ui/pixel/useHelp'
import { push, replace, type LobbyView } from '../ui/router'
import {
  connectLan,
  createRoom,
  disconnectLan,
  joinRoom,
  leaveRoom,
  setRoomStage,
  startLanGame,
  useLanStore,
} from './client'
import { LanGuestBattle, LanHostBattle } from './LanBattle'
import type { LanResult, RoomInfo } from './protocol'

const WHITE = 'white'
const GREY = '#999'
const RED = '#db2b00'
const GREEN = '#96d332'
const YELLOW = '#e7ad3e'
const MAX_NAME_LENGTH = 12

/**
 * 联机外壳：#/lobby 房间列表、#/lobby/create 创建、#/lobby/room 等待页。
 * 三个页面共用这一个组件实例，WebSocket 连接在页面之间不断；房主开局后同一路由里切到对战画面。
 */
export default function Lobby({ view }: { view: LobbyView }) {
  const status = useLanStore((s) => s.status)
  const room = useLanStore((s) => s.room)
  const role = useLanStore((s) => s.role)
  const playing = useLanStore((s) => s.playing)
  const viewRef = useRef(view)
  viewRef.current = view

  useEffect(() => {
    connectLan()
    return disconnectLan
  }, [])

  // 进出房间由服务端消息驱动，页面跟着换
  const roomId = room?.id ?? null
  useEffect(() => {
    if (roomId != null) replace('/lobby/room')
    else if (viewRef.current === 'room') replace('/lobby')
  }, [roomId])

  // 浏览器后退离开了房间页，等同于离开房间
  useEffect(() => {
    if (view !== 'room') leaveRoom()
  }, [view])

  if (playing && role === 'host' && room != null) return <LanHostBattle stageName={room.stage} />
  if (playing && role === 'guest') return <LanGuestBattle />
  if (status !== 'open') return <ConnectionPage />
  if (view === 'create') return <CreatePage />
  if (view === 'room') return room == null ? null : <RoomPage room={room} />
  return <ListPage />
}

const PREVIEW_SIZE = (FIELD_SIZE * 3) / 8

/** 关卡缩略图加一圈暗色边框，地图边缘的空地才看得出范围 */
function FramedPreview({ stage, x, y }: { stage: RawStageConfig; x: number; y: number }) {
  return (
    <>
      <rect
        x={x - 1.5}
        y={y - 1.5}
        width={PREVIEW_SIZE + 3}
        height={PREVIEW_SIZE + 3}
        fill="none"
        stroke="#333"
      />
      <StagePreview stage={stage} x={x} y={y} scale={3 / 8} />
    </>
  )
}

/** 以屏幕中线居中放置一行文字 */
function centerX(text: string, scale = 1): number {
  return 128 - text.length * 4 * scale
}

function SmallText({
  content,
  x,
  y,
  fill = WHITE,
}: {
  content: string
  x: number
  y: number
  fill?: string
}) {
  return (
    <g transform={`translate(${x}, ${y}) scale(0.5)`}>
      <PixelText content={content} fill={fill} />
    </g>
  )
}

function Notice({ y }: { y: number }) {
  const notice = useLanStore((s) => s.notice)
  return notice == null ? null : <PixelText content={notice} x={centerX(notice)} y={y} fill={RED} />
}

/** 别人能打开的大厅地址，只显示第一个（多网卡时通常第一个就是局域网） */
function ShareLine({ y }: { y: number }) {
  const url = useLanStore((s) => s.lanUrls[0])
  return url == null ? null : <SmallText content={`share: ${url}`} x={0.5 * B} y={y} fill={GREY} />
}

function stageIndexOf(name: string): number {
  return Math.max(
    0,
    stages.findIndex((s) => s.name === name),
  )
}

/** ← 12 → 的关卡选择；x/y 是左箭头的位置 */
function StagePicker({
  stageName,
  onChange,
  x,
  y,
  focused,
  onHover,
}: {
  stageName: string
  onChange: (name: string) => void
  x: number
  y: number
  focused: boolean
  onHover?: () => void
}) {
  const index = stageIndexOf(stageName)
  const prev = () => index > 0 && onChange(stages[index - 1].name)
  const next = () => index < stages.length - 1 && onChange(stages[index + 1].name)
  return (
    <g onMouseOver={onHover}>
      <TextButton content="←" x={x} y={y} textFill={WHITE} disabled={index === 0} onClick={prev} />
      <PixelText content={stageName.padStart(2, ' ')} x={x + 1.25 * B} y={y} />
      <TextButton
        content="→"
        x={x + 3 * B}
        y={y}
        textFill={WHITE}
        disabled={index === stages.length - 1}
        onClick={next}
      />
      {focused && (
        <FocusFrame x={x - 0.5 * B} y={y - 0.375 * B} width={4.5 * B} height={1.25 * B} />
      )}
    </g>
  )
}

/** 连接中 / 断开 */
function ConnectionPage() {
  const status = useLanStore((s) => s.status)
  const [focus, setFocus] = useState<'retry' | 'back'>('retry')
  const back = () => replace('/')
  const retry = () => connectLan()
  useMenuKeys((key, e) => {
    if (key === 'back') back()
    else if (key === 'left' || key === 'right') setFocus(focus === 'retry' ? 'back' : 'retry')
    else if (key === 'confirm' && !e.repeat) {
      if (focus === 'retry') retry()
      else back()
    }
  })
  return (
    <Screen background="#000000">
      <PixelText content="lan lobby" x={0.5 * B} y={0.5 * B} />
      {status === 'connecting' ? (
        <PixelText content="connecting..." x={centerX('connecting...')} y={6 * B} fill={GREY} />
      ) : (
        <g>
          <Notice y={6 * B} />
          <TextButton
            content="retry"
            x={4.5 * B}
            y={8 * B}
            textFill={WHITE}
            focused={focus === 'retry'}
            onMouseOver={() => setFocus('retry')}
            onClick={retry}
          />
          <TextButton
            content="back"
            x={9 * B}
            y={8 * B}
            textFill={WHITE}
            focused={focus === 'back'}
            onMouseOver={() => setFocus('back')}
            onClick={back}
          />
        </g>
      )}
    </Screen>
  )
}

const LIST_TOP = 3 * B
const ROW_HEIGHT = B
const VISIBLE_ROWS = 7
/** status 最长 7 个字（waiting / playing），要收在 15.25 * B 的选中框里 */
const COLUMNS = { name: 1.25 * B, stage: 7.75 * B, players: 9.25 * B, status: 11.25 * B }

type ListFocus = { kind: 'room'; id: number } | { kind: 'button'; name: 'create' | 'back' }

/** #/lobby：房间列表 */
function ListPage() {
  const rooms = useLanStore((s) => s.rooms)
  const [focus, setFocus] = useState<ListFocus>({ kind: 'button', name: 'create' })
  const help = useHelp([
    [
      {
        rows: [
          ['up/down', 'select'],
          ['fire', 'join / confirm'],
          ['esc', 'back'],
        ],
      },
    ],
  ])

  const joinable = (room: RoomInfo) => room.players < 2 && !room.playing
  const focusedIndex = focus.kind === 'room' ? rooms.findIndex((r) => r.id === focus.id) : -1
  // 聚焦的房间消失了（被别人加满或解散），焦点落回按钮
  const current: ListFocus =
    focus.kind === 'room' && focusedIndex === -1 ? { kind: 'button', name: 'create' } : focus
  // 焦点移到可见范围以下时向下滚
  const top = Math.max(0, Math.min(focusedIndex - VISIBLE_ROWS + 1, rooms.length - VISIBLE_ROWS))
  const visible = rooms.slice(top, top + VISIBLE_ROWS)

  const back = () => replace('/')
  const create = () => push('/lobby/create')
  const activate = (f: ListFocus) => {
    if (f.kind === 'button') {
      if (f.name === 'create') create()
      else back()
      return
    }
    const room = rooms.find((r) => r.id === f.id)
    if (room != null && joinable(room)) joinRoom(room.id)
  }

  useMenuKeys((key, e) => {
    if (key === 'back') {
      back()
    } else if (key === 'up' || key === 'down') {
      const index = current.kind === 'room' ? focusedIndex : rooms.length
      const next = Math.max(0, Math.min(rooms.length, index + (key === 'up' ? -1 : 1)))
      setFocus(
        next === rooms.length
          ? { kind: 'button', name: current.kind === 'button' ? current.name : 'create' }
          : { kind: 'room', id: rooms[next].id },
      )
    } else if ((key === 'left' || key === 'right') && current.kind === 'button') {
      setFocus({ kind: 'button', name: current.name === 'create' ? 'back' : 'create' })
    } else if (key === 'confirm' && !e.repeat) {
      activate(current)
    }
  })

  return (
    <Screen background="#000000">
      <PixelText content="lan lobby" x={0.5 * B} y={0.5 * B} />
      <SmallText content="room" x={COLUMNS.name} y={2 * B} fill={GREY} />
      <SmallText content="stage" x={COLUMNS.stage} y={2 * B} fill={GREY} />
      <SmallText content="players" x={COLUMNS.players} y={2 * B} fill={GREY} />
      <SmallText content="status" x={COLUMNS.status} y={2 * B} fill={GREY} />

      {rooms.length === 0 && (
        <g>
          <PixelText content="no battles yet" x={centerX('no battles yet')} y={5 * B} fill={GREY} />
          <SmallText
            content="create one and wait for Ⅱp"
            x={centerX('create one and wait for Ⅱp', 0.5)}
            y={6.25 * B}
            fill={GREY}
          />
        </g>
      )}
      {visible.map((room, i) => {
        const y = LIST_TOP + i * ROW_HEIGHT
        const ok = joinable(room)
        const fill = ok ? WHITE : GREY
        const focused = current.kind === 'room' && current.id === room.id
        return (
          <g key={room.id}>
            <rect
              className={ok ? 'text-area' : 'text-area disabled'}
              x={0.75 * B}
              y={y - 0.25 * B}
              width={14.5 * B}
              height={ROW_HEIGHT}
              onMouseOver={() => setFocus({ kind: 'room', id: room.id })}
              onClick={() => activate({ kind: 'room', id: room.id })}
            />
            <g style={{ pointerEvents: 'none' }}>
              <PixelText content={room.name} x={COLUMNS.name} y={y} fill={fill} />
              <PixelText
                content={room.stage.padStart(2, ' ')}
                x={COLUMNS.stage}
                y={y}
                fill={fill}
              />
              <PixelText content={`${room.players}/2`} x={COLUMNS.players} y={y} fill={fill} />
              <PixelText
                content={room.playing ? 'playing' : room.players < 2 ? 'waiting' : 'full'}
                x={COLUMNS.status}
                y={y}
                fill={room.playing ? YELLOW : ok ? GREEN : GREY}
              />
            </g>
            {focused && (
              <FocusFrame x={0.75 * B} y={y - 0.25 * B} width={14.5 * B} height={ROW_HEIGHT} />
            )}
          </g>
        )
      })}
      {rooms.length > VISIBLE_ROWS && (
        <SmallText
          content={`${top + 1}-${top + visible.length} of ${rooms.length}`}
          x={12.5 * B}
          y={10.125 * B}
          fill={GREY}
        />
      )}

      <TextButton
        content="create battle"
        x={2 * B}
        y={11 * B}
        textFill={WHITE}
        stroke={GREEN}
        focused={current.kind === 'button' && current.name === 'create'}
        onMouseOver={() => setFocus({ kind: 'button', name: 'create' })}
        onClick={create}
      />
      <TextButton
        content="back"
        x={11 * B}
        y={11 * B}
        textFill={WHITE}
        focused={current.kind === 'button' && current.name === 'back'}
        onMouseOver={() => setFocus({ kind: 'button', name: 'back' })}
        onClick={back}
      />
      <Notice y={12.5 * B} />
      <ShareLine y={14.5 * B} />
      {help.button}
      {help.overlay}
    </Screen>
  )
}

type CreateFocus = 'name' | 'stage' | 'create' | 'cancel'
const CREATE_ROWS: CreateFocus[][] = [['name'], ['stage'], ['create', 'cancel']]

/** #/lobby/create：起房间名、选起始关卡 */
function CreatePage() {
  const [name, setName] = useState('')
  const [stageName, setStageName] = useState(stages[0].name)
  const [focus, setFocus] = useState<CreateFocus>('create')
  const [typing, setTyping] = useState(false)
  const inputRef = useRef<SVGGElement>(null)
  const help = useHelp(
    [
      [
        {
          rows: [
            ['up/down', 'select'],
            ['left/right', 'change stage'],
            ['fire', 'confirm'],
            ['esc', 'back'],
          ],
        },
      ],
    ],
    !typing,
  )

  const cancel = () => replace('/lobby')
  const submit = () => createRoom(name.trim(), stageName)
  const index = stageIndexOf(stageName)

  useMenuKeys((key, e) => {
    const row = CREATE_ROWS.findIndex((r) => r.includes(focus))
    if (key === 'back') {
      cancel()
    } else if (key === 'up' || key === 'down') {
      const next = (row + (key === 'up' ? -1 : 1) + CREATE_ROWS.length) % CREATE_ROWS.length
      setFocus(CREATE_ROWS[next][0])
    } else if (key === 'left' || key === 'right') {
      if (focus === 'stage') {
        const i = index + (key === 'left' ? -1 : 1)
        if (i >= 0 && i < stages.length) setStageName(stages[i].name)
      } else if (focus === 'create' || focus === 'cancel') {
        setFocus(focus === 'create' ? 'cancel' : 'create')
      }
    } else if (key === 'confirm' && !e.repeat) {
      if (focus === 'name') inputRef.current?.focus()
      else if (focus === 'stage') setFocus('create')
      else if (focus === 'create') submit()
      else cancel()
    }
  }, !typing)

  return (
    <Screen background="#000000">
      <PixelText content="create battle" x={0.5 * B} y={0.5 * B} />

      <PixelText content="name" x={1 * B} y={2.5 * B} fill={focus === 'name' ? WHITE : GREY} />
      {/* 画在输入框下面，点击落到输入框上 */}
      {name === '' && !typing && (
        <SmallText content="optional" x={5 * B} y={2.625 * B} fill={GREY} />
      )}
      <g onMouseOver={() => !typing && setFocus('name')}>
        <TextInput
          ref={inputRef}
          x={5 * B}
          y={2.5 * B}
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={setName}
          onFocusChange={(f) => {
            setTyping(f)
            if (f) setFocus('name')
          }}
        />
      </g>
      {focus === 'name' && !typing && (
        <FocusFrame
          x={5 * B - 0.375 * B}
          y={2.5 * B - 0.375 * B}
          width={MAX_NAME_LENGTH * 0.5 * B + 0.75 * B}
          height={1.25 * B}
        />
      )}

      <PixelText content="stage" x={1 * B} y={4 * B} fill={focus === 'stage' ? WHITE : GREY} />
      <StagePicker
        stageName={stageName}
        onChange={setStageName}
        x={5 * B}
        y={4 * B}
        focused={focus === 'stage'}
        onHover={() => !typing && setFocus('stage')}
      />
      <FramedPreview stage={stages[index]} x={5 * B} y={5.25 * B} />

      <TextButton
        content="create"
        x={3.5 * B}
        y={11 * B}
        textFill={WHITE}
        stroke={GREEN}
        focused={focus === 'create'}
        onMouseOver={() => setFocus('create')}
        onClick={submit}
      />
      <TextButton
        content="cancel"
        x={9 * B}
        y={11 * B}
        textFill={WHITE}
        focused={focus === 'cancel'}
        onMouseOver={() => setFocus('cancel')}
        onClick={cancel}
      />
      <Notice y={12.5 * B} />
      {help.button}
      {help.overlay}
    </Screen>
  )
}

type RoomFocus = 'stage' | 'start' | 'leave'

/** #/lobby/room：等人、选关、开局；对局结束或对方离开后回到这里 */
function RoomPage({ room }: { room: RoomInfo }) {
  const role = useLanStore((s) => s.role)
  const lastResult = useLanStore((s) => s.lastResult)
  const isHost = role === 'host'
  const ready = room.players === 2
  const [focus, setFocus] = useState<RoomFocus>(isHost ? 'start' : 'leave')
  const blinkVisible = useBlink()
  const help = useHelp([
    [
      {
        rows: isHost
          ? [
              ['left/right', 'change stage'],
              ['fire', 'start'],
              ['esc', 'leave'],
            ]
          : [['esc', 'leave']],
      },
    ],
  ])

  const rows: RoomFocus[][] = isHost ? [['stage'], ['start', 'leave']] : [['leave']]
  const activate = (f: RoomFocus) => {
    if (f === 'start') startLanGame()
    else if (f === 'leave') leaveRoom()
  }

  useMenuKeys((key, e) => {
    const row = rows.findIndex((r) => r.includes(focus))
    if (key === 'back') {
      leaveRoom()
    } else if (key === 'up' || key === 'down') {
      const next = (row + (key === 'up' ? -1 : 1) + rows.length) % rows.length
      setFocus(rows[next][0])
    } else if (key === 'left' || key === 'right') {
      if (focus === 'stage') {
        const i = stageIndexOf(room.stage) + (key === 'left' ? -1 : 1)
        if (i >= 0 && i < stages.length) setRoomStage(stages[i].name)
      } else if (isHost) {
        setFocus(focus === 'start' ? 'leave' : 'start')
      }
    } else if (key === 'confirm' && !e.repeat) {
      // 刚打完一局时开火键可能还按着，自动重复的 keydown 不能直接开下一局
      activate(focus)
    }
  })

  let status: { text: string; fill: string; blink: boolean }
  if (isHost && ready) status = { text: 'press fire to start', fill: GREEN, blink: true }
  else if (isHost) status = { text: 'waiting for Ⅱp to join', fill: GREY, blink: false }
  else status = { text: 'waiting for Ⅰp to start', fill: GREY, blink: false }

  const seats: { label: string; role: string; here: boolean; you: boolean }[] = [
    { label: 'Ⅰp', role: 'host', here: true, you: isHost },
    { label: 'Ⅱp', role: 'guest', here: ready, you: !isHost },
  ]

  return (
    <Screen background="#000000">
      <PixelText content={room.name} x={0.5 * B} y={0.5 * B} />
      {seats.map((seat, i) => {
        const y = (2.25 + i * 1.25) * B
        return (
          <g key={seat.label}>
            {seat.you && <PixelText content="→" x={1 * B} y={y} fill={YELLOW} />}
            <PixelText content={seat.label} x={2 * B} y={y} fill={seat.here ? WHITE : GREY} />
            <PixelText content={seat.role} x={4 * B} y={y} fill={seat.here ? WHITE : GREY} />
            <PixelText
              content={seat.here ? 'ready' : 'waiting...'}
              x={8 * B}
              y={y}
              fill={seat.here ? GREEN : GREY}
            />
          </g>
        )
      })}

      <PixelText content="stage" x={2 * B} y={5.5 * B} fill={focus === 'stage' ? WHITE : GREY} />
      {isHost ? (
        <StagePicker
          stageName={room.stage}
          onChange={setRoomStage}
          x={2 * B}
          y={6.75 * B}
          focused={focus === 'stage'}
          onHover={() => setFocus('stage')}
        />
      ) : (
        <PixelText content={room.stage} x={3.25 * B} y={6.75 * B} />
      )}
      <FramedPreview stage={stages[stageIndexOf(room.stage)]} x={9 * B} y={5 * B} />

      {(!status.blink || blinkVisible) && (
        <PixelText content={status.text} x={centerX(status.text)} y={10.5 * B} fill={status.fill} />
      )}
      {lastResult != null && <ResultLine result={lastResult} y={11.625 * B} />}
      <Notice y={12.25 * B} />

      {isHost && (
        <TextButton
          content="start"
          x={4 * B}
          y={13.25 * B}
          textFill={WHITE}
          stroke={ready ? GREEN : 'none'}
          disabled={!ready}
          focused={focus === 'start'}
          onMouseOver={() => setFocus('start')}
          onClick={() => activate('start')}
        />
      )}
      <TextButton
        content="leave"
        x={isHost ? 9 * B : 6.75 * B}
        y={13.25 * B}
        textFill={WHITE}
        focused={focus === 'leave'}
        onMouseOver={() => setFocus('leave')}
        onClick={() => activate('leave')}
      />
      {isHost && !ready && <ShareLine y={14.5 * B} />}
      {help.button}
      {help.overlay}
    </Screen>
  )
}

function ResultLine({ result, y }: { result: LanResult; y: number }) {
  const outcome = result.cleared ? 'all cleared' : `game over at stage ${result.stageName}`
  const scores = result.scores
    .map((score, i) => `${i === 0 ? 'Ⅰp' : 'Ⅱp'}-${formatScore(score).trim()}`)
    .join('  ')
  const text = `last: ${outcome}  ${scores}`
  return <SmallText content={text} x={centerX(text, 0.5)} y={y} fill={YELLOW} />
}
