// @vitest-environment node
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { NetworkInterfaceInfo } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { createLanRelay, lanAddresses, type LanRelay } from '../bin/lan-relay.js'

interface Client {
  ws: WebSocket
  /** 等下一条满足条件的消息 */
  next: (pred?: (msg: unknown) => boolean) => Promise<unknown>
  closed: Promise<number>
}

function connect(port: number, path = '/lan'): Promise<Client> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`)
  const queue: unknown[] = []
  const waiters: { pred: (msg: unknown) => boolean; resolve: (msg: unknown) => void }[] = []
  ws.on('message', (data) => {
    const text = data.toString()
    const msg: unknown = text.startsWith('{') ? JSON.parse(text) : text
    const i = waiters.findIndex((w) => w.pred(msg))
    if (i === -1) queue.push(msg)
    else waiters.splice(i, 1)[0].resolve(msg)
  })
  const next = (pred: (msg: unknown) => boolean = () => true) =>
    new Promise<unknown>((resolve) => {
      const i = queue.findIndex(pred)
      if (i !== -1) resolve(queue.splice(i, 1)[0])
      else waiters.push({ pred, resolve })
    })
  const closed = new Promise<number>((resolve) => ws.on('close', (code) => resolve(code)))
  return new Promise((resolve, reject) => {
    ws.on('open', () => resolve({ ws, next, closed }))
    ws.on('error', reject)
  })
}

const typeIs = (t: string) => (msg: unknown) => (msg as { t?: string }).t === t
const isRoom = typeIs('room')

describe('LAN 中继', () => {
  let server: Server
  let relay: LanRelay
  let port: number
  const clients: Client[] = []

  beforeEach(async () => {
    server = createServer((req, res) => {
      if (!relay.handleRequest(req, res)) res.writeHead(404).end()
    })
    relay = createLanRelay({ base: '/battle-city/' })
    server.on('upgrade', (req, socket, head) => {
      if (!relay.handleUpgrade(req, socket, head)) socket.destroy()
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
  })

  afterEach(async () => {
    for (const c of clients.splice(0)) c.ws.terminate()
    relay.close()
    await new Promise((resolve) => server.close(resolve))
  })

  const join = async () => {
    const c = await connect(port)
    clients.push(c)
    await c.next(typeIs('hello'))
    await c.next(typeIs('rooms'))
    return c
  }
  const send = (c: Client, msg: object) => c.ws.send(JSON.stringify(msg))

  /** a 建房，b 加入 */
  const pair = async () => {
    const a = await join()
    const b = await join()
    send(a, { t: 'create', name: 'duel', stage: '3' })
    const created = (await a.next(isRoom)) as { room: { id: number } }
    send(b, { t: 'join', roomId: created.room.id })
    await b.next(isRoom)
    await a.next(isRoom)
    return { a, b, id: created.room.id }
  }

  it('连上先收到局域网地址和房间列表，地址带 base 和 hash 路由', async () => {
    const c = await connect(port)
    clients.push(c)
    const hello = (await c.next(typeIs('hello'))) as { lanUrls: string[] }
    for (const url of hello.lanUrls) {
      expect(url).toMatch(new RegExp(`^http://[\\d.]+:${port}/battle-city/#/lobby$`))
    }
    expect(await c.next(typeIs('rooms'))).toEqual({ t: 'rooms', rooms: [] })
  })

  it('握手协商 permessage-deflate，小消息也照常收发', async () => {
    const [a, b] = [await join(), await join()]
    expect(a.ws.extensions).toContain('permessage-deflate')
    send(a, { t: 'create', name: 'r', stage: '1' })
    const { room } = (await a.next(isRoom)) as { room: { id: number } }
    send(b, { t: 'join', roomId: room.id })
    await b.next(isRoom)
    send(a, { t: 'f', scene: null })
    expect(await b.next(typeIs('f'))).toEqual({ t: 'f', scene: null })
  })

  it('建房的是房主，大厅里的人看到新房间；加入者是客机，满员后别人加不进', async () => {
    const watcher = await join()
    const a = await join()
    send(a, { t: 'create', name: 'duel', stage: '3' })
    const created = (await a.next(isRoom)) as { room: { id: number } }
    expect(created).toMatchObject({ role: 'host', room: { name: 'duel', stage: '3', players: 1 } })
    expect(await watcher.next(typeIs('rooms'))).toMatchObject({
      rooms: [{ id: created.room.id, name: 'duel', players: 1, playing: false }],
    })

    const b = await join()
    send(b, { t: 'join', roomId: created.room.id })
    expect(await b.next(isRoom)).toMatchObject({ role: 'guest', room: { players: 2 } })
    expect(await a.next(isRoom)).toMatchObject({ role: 'host', room: { players: 2 } })

    const c = await join()
    send(c, { t: 'join', roomId: created.room.id })
    expect(await c.next(typeIs('error'))).toEqual({ t: 'error', message: 'room is full' })
  })

  it('同房间的消息原样转给对方，控制消息不转发', async () => {
    const { a, b } = await pair()
    send(a, { t: 'start', stage: '3' })
    expect(await b.next(typeIs('start'))).toEqual({ t: 'start', stage: '3' })
    send(b, { t: 'i', b: 9 })
    expect(await a.next(typeIs('i'))).toEqual({ t: 'i', b: 9 })

    send(a, { t: 'playing', playing: true })
    expect(await b.next(isRoom)).toMatchObject({ room: { playing: true } })
    expect(await a.next(isRoom)).toMatchObject({ room: { playing: true } })
  })

  it('客机离开：房主留在房间，人数回到 1，对战状态清掉', async () => {
    const { a, b } = await pair()
    send(a, { t: 'playing', playing: true })
    await a.next(isRoom)
    b.ws.close()
    expect(
      await a.next((m) => isRoom(m) && (m as { room: { players: number } }).room.players === 1),
    ).toMatchObject({
      room: { playing: false },
    })
  })

  it('房主离开：房间解散，客机收到 room-closed 和最新房间列表', async () => {
    const { a, b } = await pair()
    a.ws.close()
    expect(await b.next(typeIs('room-closed'))).toEqual({ t: 'room-closed' })
    // b 在加入前留在大厅时收到过带这个房间的列表，这里等解散后的那条
    const emptyRooms = (m: unknown) => typeIs('rooms')(m) && (m as { rooms: [] }).rooms.length === 0
    expect(await b.next(emptyRooms)).toEqual({ t: 'rooms', rooms: [] })
  })

  it('/lan/info 可用于探测；其它路径的升级请求不接管', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/lan/info`)
    expect(await res.json()).toEqual({ rooms: 0 })
    await expect(connect(port, '/other')).rejects.toThrow()
  })
})

describe('分享地址', () => {
  it('只要非回环 IPv4，私有网段优先，VPN 常见网段排后面', () => {
    const nic = (address: string, family = 'IPv4', internal = false) =>
      ({ address, family, internal }) as NetworkInterfaceInfo
    const addresses = lanAddresses({
      lo0: [nic('127.0.0.1', 'IPv4', true)],
      utun4: [nic('100.96.1.2')],
      en0: [nic('fe80::1', 'IPv6'), nic('10.0.0.5')],
      bridge: [nic('172.20.0.1')],
      en1: [nic('192.168.31.218')],
    })
    expect(addresses).toEqual(['192.168.31.218', '10.0.0.5', '172.20.0.1', '100.96.1.2'])
  })
})
