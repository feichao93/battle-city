import type BattleScene from '../engine/BattleScene'
import { N_MAP, TANK_LEVELS } from '../engine/constants'
import type { FlickerShape } from '../engine/entities/Flicker'
import TerrainMap from '../engine/map/TerrainMap'
import type {
  Direction,
  ExplosionShape,
  PowerUpName,
  SoundName,
  TankColor,
  TankSide,
} from '../engine/types'
import type { StatisticsView } from '../engine/StatisticsAnimation'
import type {
  BulletView,
  ExplosionView,
  FlickerView,
  PowerUpView,
  ScorePopupView,
  TankView,
} from '../render/Renderer'
import type { BattleView } from '../ui/BattleOverlay'

const SIDES: TankSide[] = ['player', 'bot']
const COLORS: TankColor[] = ['yellow', 'green', 'silver', 'red']
const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']

/** [id, side, level, color, direction, x, y, flags, hp, bornAt]；枚举取下标，flags 见 TANK_FLAG */
export type TankTuple = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]
export type BulletTuple = [id: number, x: number, y: number]
export type ExplosionTuple = [id: number, cx: number, cy: number, shape: ExplosionShape]
export type PowerUpTuple = [id: number, name: PowerUpName, x: number, y: number, visible: 0 | 1]
export type FlickerTuple = [id: number, x: number, y: number, shape: FlickerShape]
export type ScorePopupTuple = [id: number, score: number, x: number, y: number, visible: 0 | 1]

const TANK_FLAG = { moving: 1, visible: 2, helmet: 4, withPowerUp: 8 }

/** 整张地形，换关时发一次；布尔格子按 4 格一个十六进制字符打包 */
export interface MapFrame {
  bricks: string
  steels: string
  rivers: string
  snows: string
  forests: string
  eagle: [number, number] | null
}

/** 渲染一关画面需要的全部状态；数组都是元组，省掉 JSON 里重复的字段名 */
export interface SceneFrame {
  /** 主机上换了一个 BattleScene 就加一，客机据此重新装载地图 */
  id: number
  time: number
  eagleBroken: 0 | 1
  /** 新的一关才带 */
  map?: MapFrame
  /** 砖 / 钢有变动时才带 */
  terrain?: { bricks: string; steels: string }
  tanks: TankTuple[]
  bullets: BulletTuple[]
  explosions: ExplosionTuple[]
  powerUps: PowerUpTuple[]
  flickers: FlickerTuple[]
  scorePopups: ScorePopupTuple[]
}

/** 主机每个逻辑帧广播给客机的消息；叠加层和结算页只在变化时带上 */
export interface FrameMessage {
  t: 'f'
  scene: SceneFrame | null
  view?: BattleView
  /** null 表示离开结算页 */
  statistics?: { view: StatisticsView; scores: number[] } | null
  sounds?: SoundName[]
}

/** 坐标保留两位小数：像素对齐渲染用不到更高精度 */
const r2 = (v: number): number => Math.round(v * 100) / 100

export function packBits(cells: boolean[]): string {
  let out = ''
  for (let i = 0; i < cells.length; i += 4) {
    let v = 0
    for (let k = 0; k < 4; k += 1) {
      if (cells[i + k]) v |= 1 << k
    }
    out += v.toString(16)
  }
  return out
}

/** 解到 into 里（原地覆盖，TerrainMap 的数组是 readonly 引用），into 的长度决定解多少格 */
export function unpackBits(hex: string, into: boolean[]): boolean[] {
  for (let i = 0; i < into.length; i += 1) {
    const v = parseInt(hex[i >> 2] ?? '0', 16)
    into[i] = (v & (1 << (i & 3))) !== 0
  }
  return into
}

/** 主机侧：把 BattleScene 编成 SceneFrame，记住上一帧的关卡和地形版本以便只发变化 */
export class SceneEncoder {
  private scene: BattleScene | null = null
  private sceneId = 0
  private terrainVersion = -1

  encode(scene: BattleScene | null): SceneFrame | null {
    if (scene == null) {
      return null
    }
    const map = scene.map
    const frame: SceneFrame = {
      id: this.sceneId,
      time: Math.round(scene.time),
      eagleBroken: map.eagleBroken ? 1 : 0,
      tanks: scene.tanks
        .filter((t) => t.alive)
        .map(
          (t): TankTuple => [
            t.tankId,
            SIDES.indexOf(t.side),
            TANK_LEVELS.indexOf(t.level),
            COLORS.indexOf(t.color),
            DIRECTIONS.indexOf(t.direction),
            r2(t.x),
            r2(t.y),
            (t.moving ? TANK_FLAG.moving : 0) |
              (t.visible ? TANK_FLAG.visible : 0) |
              (t.helmetDuration > 0 ? TANK_FLAG.helmet : 0) |
              (t.withPowerUp ? TANK_FLAG.withPowerUp : 0),
            t.hp,
            Math.round(t.bornAt),
          ],
        ),
      bullets: scene.bullets.map((b) => [b.bulletId, r2(b.x), r2(b.y)]),
      explosions: scene.explosions.map((e) => [e.id, r2(e.cx), r2(e.cy), e.shape()]),
      powerUps: scene.powerUps.map((p) => [p.id, p.name, r2(p.x), r2(p.y), p.visible ? 1 : 0]),
      flickers: scene.flickers.map((f) => [f.id, r2(f.x), r2(f.y), f.shape()]),
      scorePopups: scene.scorePopups.map((p) => [
        p.id,
        p.score,
        r2(p.x),
        r2(p.y),
        p.visible ? 1 : 0,
      ]),
    }
    if (scene !== this.scene) {
      this.scene = scene
      this.sceneId += 1
      frame.id = this.sceneId
      frame.map = {
        bricks: packBits(map.bricks),
        steels: packBits(map.steels),
        rivers: packBits(map.rivers),
        snows: packBits(map.snows),
        forests: packBits(map.forests),
        eagle: map.eagle == null ? null : [map.eagle.x, map.eagle.y],
      }
      this.terrainVersion = map.version
    } else if (map.version !== this.terrainVersion) {
      frame.terrain = { bricks: packBits(map.bricks), steels: packBits(map.steels) }
      this.terrainVersion = map.version
    }
    return frame
  }
}

const cells = (n: number): boolean[] => new Array<boolean>(n * n).fill(false)

/** 客机侧：按收到的 SceneFrame 还原出 Renderer 能直接吃的对象 */
export class SceneMirror {
  id = 0
  /** 还没收到第一关的地图时为 null，这时不渲染战场 */
  map: TerrainMap | null = null
  time = 0
  tanks: TankView[] = []
  bullets: BulletView[] = []
  explosions: ExplosionView[] = []
  powerUps: PowerUpView[] = []
  flickers: FlickerView[] = []
  scorePopups: ScorePopupView[] = []

  apply(frame: SceneFrame | null): void {
    if (frame == null) {
      return
    }
    if (frame.map != null) {
      const m = frame.map
      this.map = new TerrainMap({
        name: '',
        difficulty: 1,
        bricks: unpackBits(m.bricks, cells(N_MAP.BRICK)),
        steels: unpackBits(m.steels, cells(N_MAP.STEEL)),
        rivers: unpackBits(m.rivers, cells(N_MAP.RIVER)),
        snows: unpackBits(m.snows, cells(N_MAP.SNOW)),
        forests: unpackBits(m.forests, cells(N_MAP.FOREST)),
        eagle: m.eagle == null ? null : { x: m.eagle[0], y: m.eagle[1] },
        bots: [],
      })
      this.id = frame.id
    }
    const map = this.map
    if (map == null || frame.id !== this.id) {
      // 中途漏了换关那一帧（正常不会发生，WebSocket 有序可靠），等下一关
      return
    }
    if (frame.terrain != null) {
      unpackBits(frame.terrain.bricks, map.bricks)
      unpackBits(frame.terrain.steels, map.steels)
      map.version += 1
    }
    map.eagleBroken = frame.eagleBroken === 1
    this.time = frame.time
    this.tanks = frame.tanks.map(
      ([tankId, side, level, color, direction, x, y, flags, hp, bornAt]) => ({
        tankId,
        alive: true,
        side: SIDES[side],
        level: TANK_LEVELS[level],
        color: COLORS[color],
        direction: DIRECTIONS[direction],
        x,
        y,
        moving: (flags & TANK_FLAG.moving) !== 0,
        visible: (flags & TANK_FLAG.visible) !== 0,
        // Renderer 只判断 > 0
        helmetDuration: (flags & TANK_FLAG.helmet) !== 0 ? 1 : 0,
        withPowerUp: (flags & TANK_FLAG.withPowerUp) !== 0,
        hp,
        bornAt,
      }),
    )
    this.bullets = frame.bullets.map(([bulletId, x, y]) => ({ bulletId, x, y }))
    this.explosions = frame.explosions.map(([id, cx, cy, shape]) => ({
      id,
      cx,
      cy,
      shape: () => shape,
    }))
    this.powerUps = frame.powerUps.map(([id, name, x, y, visible]) => ({
      id,
      name,
      x,
      y,
      visible: visible === 1,
    }))
    this.flickers = frame.flickers.map(([id, x, y, shape]) => ({ id, x, y, shape: () => shape }))
    this.scorePopups = frame.scorePopups.map(([id, score, x, y, visible]) => ({
      id,
      score,
      x,
      y,
      visible: visible === 1,
    }))
  }
}

/** 客机累计的全部画面状态；消息到达时更新，渲染循环按帧读取 */
export class FrameMirror {
  readonly scene = new SceneMirror()
  view: BattleView | null = null
  statistics: { view: StatisticsView; scores: number[] } | null = null
  /** 待播放的音效，渲染循环取走 */
  sounds: SoundName[] = []
  /** 收到的帧数，渲染循环据此跳过没有新数据的 rAF */
  frames = 0

  apply(msg: FrameMessage): void {
    this.frames += 1
    this.scene.apply(msg.scene)
    if (msg.view !== undefined) this.view = msg.view
    if (msg.statistics !== undefined) this.statistics = msg.statistics
    if (msg.sounds != null) {
      // 页面在后台时 rAF 停了，回来别一口气补放一大串
      this.sounds = [...this.sounds, ...msg.sounds].slice(-8)
    }
  }
}
