import { networkInterfaces } from 'node:os'
import { WebSocketServer } from 'ws'

export const LAN_PATH = '/lan'
/** 前端据此判断能不能联机：静态部署（gh-pages、不带 host 的 CLI）下这个地址是 404 */
export const LAN_INFO_PATH = '/lan/info'

const MAX_ROOMS = 32
const MAX_NAME_LENGTH = 12

/** 服务端自己处理的消息；其余消息原样转给同房间的另一个人 */
const CONTROL_TYPES = new Set(['create', 'join', 'leave', 'stage', 'playing'])

/** 家用路由最常见的网段排前面；VPN 常用 100.64/10、198.18/15 这类非私有段，排到最后 */
function addressRank(ip) {
  if (ip.startsWith('192.168.')) return 0
  if (ip.startsWith('10.')) return 1
  const [a, b] = ip.split('.').map(Number)
  if (a === 172 && b >= 16 && b <= 31) return 2
  return 3
}

/** 本机非回环的 IPv4 地址，局域网私有段优先 */
export function lanAddresses(interfaces = networkInterfaces()) {
  const result = []
  for (const list of Object.values(interfaces)) {
    for (const info of list ?? []) {
      // node 18.0–18.3 的 family 是数字 4
      if ((info.family === 'IPv4' || info.family === 4) && !info.internal) {
        result.push(info.address)
      }
    }
  }
  return result.sort((x, y) => addressRank(x) - addressRank(y))
}

/** 局域网里别人打开的大厅地址；base 是页面所在路径（vite dev 是 /battle-city/） */
export function lanUrls(port, base = '/') {
  return lanAddresses().map((ip) => `http://${ip}:${port}${base}#/lobby`)
}

/**
 * 联机中继：多个房间，每个房间 2 人。创建者是 1P，他的浏览器跑引擎；加入者是 2P。
 * 服务端只管房间（create / join / leave / stage / playing）和转发，不跑引擎。
 */
export function createLanRelay({ base = '/' } = {}) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1 << 20,
    // 每帧画面只有两三百字节、前后帧几乎一样，带上下文压缩后约剩 1/10；ws 默认 1024B 以下不压
    perMessageDeflate: { threshold: 0 },
  })
  /** @type {Map<number, { id: number, name: string, stage: string, host: import('ws').WebSocket, guest: import('ws').WebSocket | null, playing: boolean }>} */
  const rooms = new Map()
  /** 每个连接所在的房间，在大厅里为 null */
  const members = new Map()
  let nextRoomId = 1

  const send = (ws, msg) => {
    if (ws != null && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
  }
  const infoOf = (room) => ({
    id: room.id,
    name: room.name,
    stage: room.stage,
    players: room.guest == null ? 1 : 2,
    playing: room.playing,
  })
  const roomList = () => [...rooms.values()].map(infoOf)
  /** 只有在大厅里的人需要房间列表 */
  const broadcastRooms = () => {
    const msg = { t: 'rooms', rooms: roomList() }
    for (const [ws, room] of members) {
      if (room == null) send(ws, msg)
    }
  }
  const sendRoom = (room) => {
    const info = infoOf(room)
    send(room.host, { t: 'room', room: info, role: 'host' })
    send(room.guest, { t: 'room', room: info, role: 'guest' })
  }

  const leave = (ws) => {
    const room = members.get(ws)
    if (room == null) return
    members.set(ws, null)
    if (room.host === ws) {
      rooms.delete(room.id)
      if (room.guest != null) {
        members.set(room.guest, null)
        send(room.guest, { t: 'room-closed' })
      }
    } else {
      room.guest = null
      room.playing = false
      sendRoom(room)
    }
    broadcastRooms()
  }

  const onControl = (ws, msg) => {
    const current = members.get(ws)
    switch (msg.t) {
      case 'create': {
        if (current != null) leave(ws)
        if (rooms.size >= MAX_ROOMS) {
          send(ws, { t: 'error', message: 'too many rooms' })
          return
        }
        const id = nextRoomId++
        const name = String(msg.name ?? '')
          .trim()
          .slice(0, MAX_NAME_LENGTH)
        const room = {
          id,
          name: name === '' ? `room ${id}` : name,
          stage: String(msg.stage ?? '1'),
          host: ws,
          guest: null,
          playing: false,
        }
        rooms.set(id, room)
        members.set(ws, room)
        sendRoom(room)
        broadcastRooms()
        return
      }
      case 'join': {
        const room = rooms.get(msg.roomId)
        if (room == null) {
          send(ws, { t: 'error', message: 'room is gone' })
          send(ws, { t: 'rooms', rooms: roomList() })
          return
        }
        if (room.guest != null || room.host === ws) {
          send(ws, { t: 'error', message: 'room is full' })
          return
        }
        if (current != null) leave(ws)
        room.guest = ws
        members.set(ws, room)
        sendRoom(room)
        broadcastRooms()
        return
      }
      case 'leave':
        leave(ws)
        send(ws, { t: 'rooms', rooms: roomList() })
        return
      case 'stage':
        if (current?.host === ws && !current.playing) {
          current.stage = String(msg.stage)
          sendRoom(current)
          broadcastRooms()
        }
        return
      case 'playing':
        if (current?.host === ws) {
          current.playing = current.guest != null && msg.playing === true
          sendRoom(current)
          broadcastRooms()
        }
    }
  }

  wss.on('connection', (ws, req) => {
    members.set(ws, null)
    send(ws, { t: 'hello', lanUrls: lanUrls(req.socket.localPort, base) })
    send(ws, { t: 'rooms', rooms: roomList() })

    ws.on('message', (data, isBinary) => {
      if (isBinary) return
      const text = data.toString()
      let msg
      try {
        msg = JSON.parse(text)
      } catch {
        return
      }
      if (CONTROL_TYPES.has(msg?.t)) {
        onControl(ws, msg)
        return
      }
      const room = members.get(ws)
      if (room == null) return
      const peer = room.host === ws ? room.guest : room.host
      if (peer != null && peer.readyState === peer.OPEN) peer.send(text)
    })
    ws.on('close', () => {
      leave(ws)
      members.delete(ws)
    })
  })

  return {
    /** 是 /lan 的升级请求就接管并返回 true；其它路径不碰，留给别的监听者（如 vite HMR） */
    handleUpgrade(req, socket, head) {
      const { pathname } = new URL(req.url ?? '/', 'http://localhost')
      if (pathname !== LAN_PATH) return false
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
      return true
    },
    /** 处理 /lan/info，返回是否已处理 */
    handleRequest(req, res) {
      const { pathname } = new URL(req.url ?? '/', 'http://localhost')
      if (pathname !== LAN_INFO_PATH) return false
      const body = JSON.stringify({ rooms: rooms.size })
      res.writeHead(200, {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'content-length': Buffer.byteLength(body),
      })
      res.end(body)
      return true
    },
    close() {
      for (const ws of wss.clients) ws.terminate()
      wss.close()
    },
  }
}
