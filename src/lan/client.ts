import { create } from 'zustand'
import { useUIStore } from '../ui/store'
import { FrameMirror } from './frame'
import {
  LAN_INFO_PATH,
  LAN_PATH,
  type ClientMessage,
  type LanResult,
  type PeerMessage,
  type Role,
  type RoomInfo,
  type ServerMessage,
} from './protocol'

export type LanStatus = 'connecting' | 'open' | 'closed'

export interface LanState {
  status: LanStatus
  /** 别人能打开的大厅地址 */
  lanUrls: string[]
  rooms: RoomInfo[]
  /** 自己所在的房间 */
  room: RoomInfo | null
  role: Role | null
  /** 本地正在对战 */
  playing: boolean
  lastResult: LanResult | null
  /** 对方断开、房间已满之类的提示 */
  notice: string | null
}

const INITIAL: LanState = {
  status: 'closed',
  lanUrls: [],
  rooms: [],
  room: null,
  role: null,
  playing: false,
  lastResult: null,
  notice: null,
}

export const useLanStore = create<LanState>(() => INITIAL)

let socket: WebSocket | null = null
let mirror: FrameMirror | null = null
const listeners = new Set<(msg: PeerMessage) => void>()

export function lanSocketUrl(loc: Pick<Location, 'protocol' | 'host'> = location): string {
  return `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}${LAN_PATH}`
}

let probe: Promise<boolean> | null = null

/** 只有 `battle-city host` 和 dev server 提供 /lan/info；静态部署下是 404 或 HTML */
export function probeLan(): Promise<boolean> {
  probe ??= fetch(LAN_INFO_PATH, { cache: 'no-store' })
    .then(async (res) => res.ok && typeof (await res.json())?.rooms === 'number')
    .catch(() => false)
  return probe
}

export function connectLan(): void {
  if (socket != null) return
  const ws = new WebSocket(lanSocketUrl())
  socket = ws
  useLanStore.setState({ ...INITIAL, status: 'connecting' })
  ws.onmessage = (e) => {
    if (typeof e.data === 'string') handleMessage(JSON.parse(e.data) as ServerMessage | PeerMessage)
  }
  ws.onclose = () => {
    if (socket !== ws) return
    socket = null
    mirror = null
    useLanStore.setState({
      ...INITIAL,
      lastResult: useLanStore.getState().lastResult,
      notice: 'connection lost',
    })
  }
}

export function disconnectLan(): void {
  const ws = socket
  socket = null
  mirror = null
  ws?.close()
  useLanStore.setState(INITIAL)
}

export function sendLan(msg: ClientMessage): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg))
}

/** 订阅对方发来的消息，返回取消订阅 */
export function onPeerMessage(fn: (msg: PeerMessage) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 客机当前这局的画面；开局消息一到就创建，免得渲染器初始化期间的帧丢掉 */
export function guestMirror(): FrameMirror | null {
  return mirror
}

export function createRoom(name: string, stage: string): void {
  useLanStore.setState({ notice: null, lastResult: null })
  sendLan({ t: 'create', name, stage })
}

export function joinRoom(roomId: number): void {
  useLanStore.setState({ notice: null, lastResult: null })
  sendLan({ t: 'join', roomId })
}

/** 立即回到大厅，不等服务端确认 */
export function leaveRoom(): void {
  if (useLanStore.getState().room == null) return
  mirror = null
  sendLan({ t: 'leave' })
  useLanStore.setState({ room: null, role: null, playing: false, lastResult: null })
}

export function setRoomStage(stage: string): void {
  sendLan({ t: 'stage', stage })
}

export function startLanGame(): void {
  const { room, role } = useLanStore.getState()
  if (room == null || role !== 'host' || room.players < 2 || room.playing) return
  sendLan({ t: 'start', stage: room.stage })
  sendLan({ t: 'playing', playing: true })
  useLanStore.setState({ playing: true, notice: null, lastResult: null })
}

export function finishLanGame(result: LanResult): void {
  useUIStore.getState().recordScores(result.scores)
  sendLan({ t: 'end', result })
  sendLan({ t: 'playing', playing: false })
  useLanStore.setState({ playing: false, lastResult: result })
}

export function handleMessage(msg: ServerMessage | PeerMessage): void {
  const state = useLanStore.getState()
  switch (msg.t) {
    case 'hello':
      useLanStore.setState({ status: 'open', lanUrls: msg.lanUrls })
      return
    case 'rooms':
      useLanStore.setState({ rooms: msg.rooms })
      return
    case 'room': {
      const sameRoom = state.room?.id === msg.room.id
      // 客机离开只会让房主收到这条；房主离开时客机收到的是 room-closed
      const partnerLeft = sameRoom && state.room!.players === 2 && msg.room.players < 2
      const partnerJoined = sameRoom && state.room!.players < 2 && msg.room.players === 2
      // 有人重新加入后，上一位离开的提示就过时了
      let notice = sameRoom && !partnerJoined ? state.notice : null
      if (partnerLeft) notice = state.playing ? 'Ⅱp left the battle' : 'Ⅱp left'
      useLanStore.setState({
        room: msg.room,
        role: msg.role,
        playing: partnerLeft ? false : state.playing,
        notice,
      })
      return
    }
    case 'room-closed':
      mirror = null
      useLanStore.setState({
        room: null,
        role: null,
        playing: false,
        notice: 'Ⅰp left, room closed',
      })
      return
    case 'error':
      useLanStore.setState({ notice: msg.message })
      return
    case 'start':
      mirror = new FrameMirror()
      useLanStore.setState({ playing: true, notice: null, lastResult: null })
      break
    case 'f':
      mirror?.apply(msg)
      break
    case 'end':
      useUIStore.getState().recordScores(msg.result.scores)
      mirror = null
      useLanStore.setState({ playing: false, lastResult: msg.result })
      break
  }
  for (const fn of listeners) fn(msg)
}
