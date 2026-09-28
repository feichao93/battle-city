import { beforeEach, describe, expect, it } from 'vitest'
import { STEP_MS } from '../src/engine/Game'
import GameSession from '../src/engine/GameSession'
import { PLAYER_SPAWN_POS } from '../src/engine/constants'
import { seededRandom } from '../src/engine/random'
import { directionCodes, PLAYER1_CONTROL } from '../src/input/bindings'
import { guestMirror, handleMessage, lanSocketUrl, useLanStore } from '../src/lan/client'
import {
  FrameMirror,
  packBits,
  SceneEncoder,
  unpackBits,
  type FrameMessage,
  type SceneFrame,
} from '../src/lan/frame'
import {
  decodeInput,
  encodeInput,
  HostInput,
  REMOTE_CONTROL,
  type InputSample,
} from '../src/lan/input'
import { nextPausedBy } from '../src/lan/pause'
import { stages } from '../src/stages'
import { useUIStore } from '../src/ui/store'
import { makeStage } from './helpers'

describe('输入编码', () => {
  it('方向 × 按住开火 × 本帧按下开火，全部组合往返一致', () => {
    for (const direction of [null, 'up', 'down', 'left', 'right'] as const) {
      for (const fireHeld of [false, true]) {
        for (const firePressed of [false, true]) {
          const sample: InputSample = { direction, fireHeld, firePressed }
          const bits = encodeInput(sample)
          expect(bits).toBeLessThan(32)
          expect(decodeInput(bits)).toEqual(sample)
        }
      }
    }
  })

  it('主机把客机输入换成虚拟键：方向跟随最新样本，点按开火留下一次边沿', () => {
    const input = new HostInput()
    const remoteDirection = () => input.lastPressed(directionCodes(REMOTE_CONTROL))

    input.applyRemote({ direction: 'up', fireHeld: false, firePressed: false })
    expect(remoteDirection()).toBe(REMOTE_CONTROL.up)
    input.applyRemote({ direction: 'left', fireHeld: false, firePressed: false })
    expect(remoteDirection()).toBe(REMOTE_CONTROL.left)
    expect(input.isDown(REMOTE_CONTROL.up)).toBe(false)

    // 客机一帧内按下又松开
    input.applyRemote({ direction: null, fireHeld: false, firePressed: true })
    expect(remoteDirection()).toBeNull()
    expect(input.consumeFire(REMOTE_CONTROL)).toBe(true)
    expect(input.firePressed(REMOTE_CONTROL)).toBe(true)
    input.endTick()
    expect(input.consumeFire(REMOTE_CONTROL)).toBe(false)
    expect(input.ticks).toBe(1)

    // 按住：只有第一帧是边沿
    input.applyRemote({ direction: null, fireHeld: true, firePressed: true })
    input.endTick()
    input.applyRemote({ direction: null, fireHeld: true, firePressed: false })
    expect(input.firePressed(REMOTE_CONTROL)).toBe(false)
    expect(input.consumeFire(REMOTE_CONTROL)).toBe(true)
    input.applyRemote({ direction: null, fireHeld: false, firePressed: false })
    expect(input.consumeFire(REMOTE_CONTROL)).toBe(false)
  })

  it('客机输入驱动主机引擎里的 2P 坦克', () => {
    const input = new HostInput([PLAYER1_CONTROL, REMOTE_CONTROL])
    const session = new GameSession(
      [makeStage('1', ['1*basic'])],
      0,
      [
        { control: PLAYER1_CONTROL, color: 'yellow', spawnPos: PLAYER_SPAWN_POS.player1 },
        { control: REMOTE_CONTROL, color: 'green', spawnPos: PLAYER_SPAWN_POS.player2 },
      ],
      { play: () => {} },
      { autopilot: null, random: seededRandom(1) },
    )
    const step = () => {
      session.step(STEP_MS, input)
      input.endTick()
    }
    const p2 = () => session.scene?.tanks.find((t) => t.side === 'player' && t.color === 'green')
    while (p2() == null || !session.scene!.controllable(1)) step()
    const y0 = p2()!.y
    for (let i = 0; i < 30; i += 1) {
      input.applyRemote({ direction: 'up', fireHeld: false, firePressed: false })
      step()
    }
    expect(p2()!.y).toBeLessThan(y0)
    input.applyRemote({ direction: null, fireHeld: false, firePressed: true })
    step()
    expect(session.scene!.bullets.some((b) => b.tankId === p2()!.tankId)).toBe(true)
  })
})

describe('联机暂停', () => {
  it('任意一方都能暂停，只有暂停方能恢复', () => {
    expect(nextPausedBy(null, 'guest', true)).toBe('guest')
    expect(nextPausedBy('guest', 'host', false)).toBe('guest')
    expect(nextPausedBy('guest', 'host', true)).toBe('guest')
    expect(nextPausedBy('guest', 'guest', false)).toBeNull()
    expect(nextPausedBy(null, 'host', false)).toBeNull()
  })

  it('恢复时 releaseAll 挂起的虚拟键，客机松开后能再按下', () => {
    const input = new HostInput()
    input.applyRemote({ direction: 'up', fireHeld: true, firePressed: true })
    input.releaseAll()
    // 客机还按着：挂起期间不算按下
    input.applyRemote({ direction: 'up', fireHeld: true, firePressed: false })
    expect(input.isDown(REMOTE_CONTROL.up)).toBe(false)
    expect(input.consumeFire(REMOTE_CONTROL)).toBe(false)
    input.applyRemote({ direction: null, fireHeld: false, firePressed: false })
    input.applyRemote({ direction: 'up', fireHeld: true, firePressed: false })
    expect(input.isDown(REMOTE_CONTROL.up)).toBe(true)
    expect(input.consumeFire(REMOTE_CONTROL)).toBe(true)
  })
})

describe('地形打包', () => {
  it('任意长度的布尔格子往返一致', () => {
    const random = seededRandom(7)
    for (const n of [2704, 676, 169, 1, 5]) {
      const cells = Array.from({ length: n }, () => random() < 0.4)
      const hex = packBits(cells)
      expect(hex).toHaveLength(Math.ceil(n / 4))
      expect(unpackBits(hex, new Array<boolean>(n).fill(true))).toEqual(cells)
    }
  })
})

describe('画面序列化', () => {
  /** 两名玩家一边转圈一边开火，打一段真实关卡，每帧编码 → JSON → 客机还原 */
  function playAndMirror(ms: number) {
    const input = new HostInput([PLAYER1_CONTROL, REMOTE_CONTROL])
    const session = new GameSession(
      stages,
      0,
      [
        { control: PLAYER1_CONTROL, color: 'yellow', spawnPos: PLAYER_SPAWN_POS.player1 },
        { control: REMOTE_CONTROL, color: 'green', spawnPos: PLAYER_SPAWN_POS.player2 },
      ],
      { play: () => {} },
      { autopilot: null, random: seededRandom(3) },
    )
    const encoder = new SceneEncoder()
    const mirror = new FrameMirror()
    const sizes: number[] = []
    let mapFrames = 0
    let terrainFrames = 0
    const dirs = ['up', 'left', 'up', 'right'] as const
    for (let t = 0, i = 0; t < ms; t += STEP_MS, i += 1) {
      const direction = dirs[Math.floor(i / 40) % dirs.length]
      input.applyRemote({ direction, fireHeld: true, firePressed: i % 20 === 0 })
      input.keyDown(PLAYER1_CONTROL.fire)
      session.step(STEP_MS, input)
      input.endTick()

      const scene = encoder.encode(session.scene)
      const msg: FrameMessage = { t: 'f', scene }
      const json = JSON.stringify(msg)
      sizes.push(json.length)
      if (scene?.map != null) mapFrames += 1
      if (scene?.terrain != null) terrainFrames += 1
      mirror.apply(JSON.parse(json) as FrameMessage)
    }
    return { session, mirror, sizes, mapFrames, terrainFrames }
  }

  it('还原出的实体与主机一致，坐标误差不超过 0.005', () => {
    const { session, mirror, mapFrames, terrainFrames } = playAndMirror(20_000)
    const scene = session.scene!
    const m = mirror.scene
    expect(mapFrames).toBe(1)
    expect(terrainFrames).toBeGreaterThan(0)

    expect(m.map!.bricks).toEqual(scene.map.bricks)
    expect(m.map!.steels).toEqual(scene.map.steels)
    expect(m.map!.rivers).toEqual(scene.map.rivers)
    expect(m.map!.forests).toEqual(scene.map.forests)
    expect(m.map!.eagle).toEqual(scene.map.eagle)
    expect(m.map!.eagleBroken).toBe(scene.map.eagleBroken)
    expect(m.time).toBe(Math.round(scene.time))

    const alive = scene.tanks.filter((t) => t.alive)
    expect(m.tanks.map((t) => t.tankId)).toEqual(alive.map((t) => t.tankId))
    m.tanks.forEach((mt, i) => {
      const t = alive[i]
      expect(mt).toMatchObject({
        side: t.side,
        level: t.level,
        color: t.color,
        direction: t.direction,
        hp: t.hp,
        moving: t.moving,
        visible: t.visible,
        withPowerUp: t.withPowerUp,
      })
      expect(mt.helmetDuration > 0).toBe(t.helmetDuration > 0)
      expect(Math.abs(mt.x - t.x)).toBeLessThanOrEqual(0.005)
      expect(Math.abs(mt.y - t.y)).toBeLessThanOrEqual(0.005)
    })
    expect(m.bullets.map((b) => b.bulletId)).toEqual(scene.bullets.map((b) => b.bulletId))
    expect(m.explosions.map((e) => [e.id, e.shape()])).toEqual(
      scene.explosions.map((e) => [e.id, e.shape()]),
    )
    expect(m.flickers.map((f) => [f.id, f.shape()])).toEqual(
      scene.flickers.map((f) => [f.id, f.shape()]),
    )
    expect(m.powerUps.map((p) => [p.id, p.name, p.visible])).toEqual(
      scene.powerUps.map((p) => [p.id, p.name, p.visible]),
    )
    expect(m.scorePopups.map((p) => [p.id, p.score, p.visible])).toEqual(
      scene.scorePopups.map((p) => [p.id, p.score, p.visible]),
    )
  })

  it('每帧 JSON 体积：换关那帧带整张地形，其余帧只有实体', () => {
    const { sizes } = playAndMirror(20_000)
    const playing = sizes.filter((n) => n > 40)
    const sorted = [...playing].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const max = sorted[sorted.length - 1]
    // 基线：中位数约数百字节；整张地形的那帧约 1.2KB
    expect(median).toBeLessThan(800)
    expect(max).toBeLessThan(2000)
  })

  it('SceneEncoder 换一个 BattleScene 就重新发整张地形', () => {
    const encoder = new SceneEncoder()
    const input = new HostInput()
    const session = new GameSession(
      [makeStage('1'), makeStage('2')],
      0,
      [{ control: PLAYER1_CONTROL, color: 'yellow', spawnPos: PLAYER_SPAWN_POS.player1 }],
      { play: () => {} },
      { autopilot: null, random: seededRandom(1) },
    )
    const frames: SceneFrame[] = []
    while (session.scene == null) session.step(STEP_MS, input)
    frames.push(encoder.encode(session.scene)!)
    frames.push(encoder.encode(session.scene)!)
    expect(frames[0].map).toBeDefined()
    expect(frames[1].map).toBeUndefined()
    expect(frames[1].id).toBe(frames[0].id)
  })
})

describe('联机客户端消息', () => {
  const room = (players: 1 | 2, playing = false) => ({
    id: 7,
    name: 'room 7',
    stage: '3',
    players,
    playing,
  })

  beforeEach(() => {
    useLanStore.setState({
      status: 'open',
      rooms: [],
      room: null,
      role: null,
      playing: false,
      lastResult: null,
      notice: null,
    })
  })

  it('WebSocket 地址跟随页面协议和主机', () => {
    expect(lanSocketUrl({ protocol: 'http:', host: '192.168.1.5:8080' })).toBe(
      'ws://192.168.1.5:8080/lan',
    )
    expect(lanSocketUrl({ protocol: 'https:', host: 'example.com' })).toBe('wss://example.com/lan')
  })

  it('客机：开局建镜像并接收画面，结束后回到房间并记下结果', () => {
    useUIStore.setState({ hiScore: 1000, lastGame: null })
    handleMessage({ t: 'room', room: room(2), role: 'guest' })
    handleMessage({ t: 'start', stage: '3' })
    expect(useLanStore.getState().playing).toBe(true)
    const mirror = guestMirror()!
    handleMessage({ t: 'f', scene: null, sounds: ['stage_start'] })
    expect(mirror.frames).toBe(1)
    expect(mirror.sounds).toEqual(['stage_start'])

    const result = { stageName: '4', scores: [1200, 300], cleared: false }
    handleMessage({ t: 'end', result })
    expect(useLanStore.getState()).toMatchObject({ playing: false, lastResult: result })
    expect(useLanStore.getState().room).not.toBeNull()
    expect(guestMirror()).toBeNull()
    // 联机分数照本地双人规则刷新最高分，但不改单机结束页的 lastGame
    expect(useUIStore.getState()).toMatchObject({ hiScore: 1200, lastGame: null })
  })

  it('房主：对局中客机离开，停下对局留在房间并提示', () => {
    handleMessage({ t: 'room', room: room(2), role: 'host' })
    useLanStore.setState({ playing: true })
    handleMessage({ t: 'room', room: room(1), role: 'host' })
    expect(useLanStore.getState()).toMatchObject({
      playing: false,
      notice: 'Ⅱp left the battle',
    })
    expect(useLanStore.getState().room?.players).toBe(1)
  })

  it('客机：房主离开，房间解散回大厅', () => {
    handleMessage({ t: 'room', room: room(2), role: 'guest' })
    handleMessage({ t: 'start', stage: '3' })
    handleMessage({ t: 'room-closed' })
    expect(useLanStore.getState()).toMatchObject({
      room: null,
      role: null,
      playing: false,
      notice: 'Ⅰp left, room closed',
    })
    expect(guestMirror()).toBeNull()
  })
})
