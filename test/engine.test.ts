import { describe, expect, it } from 'vitest'
import Bullet, { resetBulletIds } from '../src/engine/entities/Bullet'
import ScorePopup from '../src/engine/entities/ScorePopup'
import Tank from '../src/engine/entities/Tank'
import TerrainMap from '../src/engine/map/TerrainMap'
import { expandBots } from '../src/engine/map/parseStage'
import {
  ceil8,
  floor8,
  getDirectionInfo,
  isPerpendicular,
  round8,
  testCollide,
} from '../src/engine/physics/geometry'
import { canTankMove } from '../src/engine/physics/collision'
import { getBulletCollision, getMBR, spreadBullet } from '../src/engine/physics/bullet-collision'
import { buildSpots } from '../src/engine/ai/spots'
import { findPath } from '../src/engine/ai/pathfinding'
import PathFollower from '../src/engine/ai/path-follower'
import { getTankSpot, spotToTankPos } from '../src/engine/ai/spots'
import { getAIFireCount, getFireResist } from '../src/engine/ai/fire-estimate'
import { updateBullets, type BulletTankHit } from '../src/engine/systems/bullet'
import { fireTank } from '../src/engine/systems/fire'
import { STEP_MS } from '../src/engine/Game'
import { applyInput, applyPlayerMove } from '../src/engine/systems/movement'
import { bulletInterval, bulletLimit, bulletPower, moveSpeed } from '../src/engine/values'
import type { Input, RawStageConfig, SoundName } from '../src/engine/types'
import { SNOW_SLIDE_LOCK, SNOW_SLIDE_START } from '../src/engine/constants'

/** 构建一张 13×13 地图，overrides 指定 "row,col" → item 编码 */
function makeMap(overrides: Record<string, string> = {}): TerrainMap {
  const map: string[] = []
  for (let row = 0; row < 13; row += 1) {
    const items: string[] = []
    for (let col = 0; col < 13; col += 1) {
      items.push(overrides[`${row},${col}`] ?? 'X')
    }
    map.push(items.join(' '))
  }
  const raw: RawStageConfig = { name: 't', difficulty: 1, map, bots: ['20*basic'] }
  return TerrainMap.fromRaw(raw)
}

describe('geometry', () => {
  it('round8 / floor8 / ceil8', () => {
    expect(round8(12)).toBe(16)
    expect(round8(11)).toBe(8)
    expect(floor8(12)).toBe(8)
    expect(ceil8(12)).toBe(16)
  })

  it('testCollide 阈值：相接在 -0.01 下不算碰撞', () => {
    const a = { x: 0, y: 0, width: 16, height: 16 }
    const touching = { x: 16, y: 0, width: 16, height: 16 }
    expect(testCollide(a, touching, 0)).toBe(true)
    expect(testCollide(a, touching, -0.01)).toBe(false)
    expect(testCollide(a, { x: 8, y: 8, width: 4, height: 4 }, -0.01)).toBe(true)
  })

  it('isPerpendicular / getDirectionInfo', () => {
    expect(isPerpendicular('up', 'left')).toBe(true)
    expect(isPerpendicular('up', 'down')).toBe(false)
    expect(getDirectionInfo('up')).toEqual({ axis: 'y', delta: -1 })
    expect(getDirectionInfo('right')).toEqual({ axis: 'x', delta: 1 })
  })
})

describe('values（坦克数值规格）', () => {
  it('moveSpeed', () => {
    expect(moveSpeed(new Tank({ side: 'player', x: 0, y: 0 }))).toBe(0.045)
    expect(moveSpeed(new Tank({ side: 'bot', level: 'fast', x: 0, y: 0 }))).toBe(0.06)
    expect(moveSpeed(new Tank({ side: 'bot', level: 'basic', x: 0, y: 0 }))).toBe(0.03)
  })
  it('bulletPower / bulletLimit / bulletInterval', () => {
    expect(bulletPower(new Tank({ side: 'player', level: 'armor', x: 0, y: 0 }))).toBe(3)
    expect(bulletPower(new Tank({ side: 'bot', level: 'power', x: 0, y: 0 }))).toBe(2)
    expect(bulletPower(new Tank({ side: 'player', level: 'basic', x: 0, y: 0 }))).toBe(1)
    expect(bulletLimit(new Tank({ side: 'player', level: 'power', x: 0, y: 0 }))).toBe(2)
    expect(bulletLimit(new Tank({ side: 'bot', level: 'power', x: 0, y: 0 }))).toBe(1)
    expect(bulletInterval(new Tank({ side: 'player', level: 'basic', x: 0, y: 0 }))).toBe(300)
    expect(bulletInterval(new Tank({ side: 'player', level: 'fast', x: 0, y: 0 }))).toBe(200)
  })
})

describe('canTankMove（坦克碰撞）', () => {
  it('空地可移动；越界不可移动', () => {
    const map = makeMap()
    const world = { map, tanks: [] as Tank[], restrictedAreas: [] }
    expect(canTankMove(world, new Tank({ side: 'player', x: 32, y: 32 }))).toBe(true)
    expect(canTankMove(world, new Tank({ side: 'player', x: -1, y: 32 }))).toBe(false)
    expect(canTankMove(world, new Tank({ side: 'player', x: 193, y: 32 }))).toBe(false)
  })

  it('砖块阻挡，雪地可通行', () => {
    const brickMap = makeMap({ '2,2': 'Bf' })
    const snowMap = makeMap({ '2,2': 'S' })
    const tank = new Tank({ side: 'player', x: 32, y: 32 }) // 正好覆盖 (2,2)
    expect(canTankMove({ map: brickMap, tanks: [], restrictedAreas: [] }, tank)).toBe(false)
    expect(canTankMove({ map: snowMap, tanks: [], restrictedAreas: [] }, tank)).toBe(true)
  })
})

describe('movement（前进 / 转向对齐）', () => {
  it('前进按 speed*delta 移动；转向后预留坐标对齐到 8 的倍数', () => {
    const map = makeMap()
    const world = { map, tanks: [] as Tank[], restrictedAreas: [] }
    const tank = new Tank({ side: 'player', direction: 'up', x: 40, y: 100 })
    applyInput(world, tank, { type: 'forward' }, 1000 / 60)
    // 0.045 * 16.667 ≈ 0.75px 向上
    expect(tank.y).toBeCloseTo(100 - 0.045 * (1000 / 60), 5)
    expect(tank.ry % 8).toBe(0)
  })

  it('被边界阻挡时回退', () => {
    const map = makeMap()
    const tank = new Tank({ side: 'player', direction: 'left', x: 0, y: 32 })
    applyInput({ map, tanks: [], restrictedAreas: [] }, tank, { type: 'forward' }, 1000 / 60)
    expect(tank.x).toBe(0)
  })

  it('转向只改变朝向', () => {
    const map = makeMap()
    const tank = new Tank({ side: 'player', direction: 'up', x: 32, y: 32 })
    applyInput(
      { map, tanks: [], restrictedAreas: [] },
      tank,
      { type: 'turn', direction: 'right' },
      1000 / 60,
    )
    expect(tank.direction).toBe('right')
  })
})

describe('snow slide（冰面滑行）', () => {
  const TICK = 1000 / 60
  const STEP = 0.045 * TICK // 玩家每 tick 位移 0.75px
  const FORWARD: Input = { type: 'forward' }
  /** 起滑之后方向键无效的 tick 数 */
  const LOCK_TICKS = Math.ceil((SNOW_SLIDE_START - SNOW_SLIDE_LOCK) / STEP)

  /** 默认在第 2~5 列、第 2~10 行铺雪；坦克在 (32, 128)，中心落在第 8 行第 2 列 */
  function setup(overrides: Record<string, string> = {}, snow = true) {
    const cells: Record<string, string> = {}
    if (snow) {
      for (let row = 2; row <= 10; row += 1) {
        for (let col = 2; col <= 5; col += 1) cells[`${row},${col}`] = 'S'
      }
    }
    const map = makeMap({ ...cells, ...overrides })
    const world = { map, tanks: [] as Tank[], restrictedAreas: [] }
    const sounds: SoundName[] = []
    const tank = new Tank({ side: 'player', direction: 'up', x: 32, y: 128 })
    const move = (input: Input | null) =>
      applyPlayerMove(world, tank, input, TICK, { play: (name) => sounds.push(name) })
    return { map, tank, sounds, move }
  }

  it('isSnowAt：按 16px 格判定，越界为 false', () => {
    const map = makeMap({ '3,4': 'S' })
    expect(map.isSnowAt(4 * 16, 3 * 16)).toBe(true)
    expect(map.isSnowAt(5 * 16 - 1, 4 * 16 - 1)).toBe(true)
    expect(map.isSnowAt(4 * 16 - 1, 3 * 16)).toBe(false)
    expect(map.isSnowAt(-1, 0)).toBe(false)
    expect(map.isSnowAt(13 * 16, 0)).toBe(false)
  })

  it('以坦克中心所在格判定是否在冰上', () => {
    // 只有第 5 行（y 80~96）是雪，坦克向上压进雪块 7px 时中心仍在第 6 行
    const outside = setup({ '5,2': 'S' }, false)
    outside.tank.y = 96 - 7
    outside.move(FORWARD)
    expect(outside.tank.slide).toBe(0)

    const inside = setup({ '5,2': 'S' }, false)
    inside.tank.y = 96 - 9
    inside.move(FORWARD)
    expect(inside.tank.slide).toBe(SNOW_SLIDE_START)
  })

  it('冰上起滑：滑行量置满并播放音效，本 tick 正常前进', () => {
    const { tank, sounds, move } = setup()
    move(FORWARD)
    expect(tank.slide).toBe(SNOW_SLIDE_START)
    expect(sounds).toEqual(['snow_slide'])
    expect(tank.y).toBeCloseTo(128 - STEP, 5)
  })

  it('锁定期忽略方向键，沿朝向前进；锁定期过后转向生效', () => {
    const { tank, move } = setup()
    move(FORWARD)
    for (let i = 0; i < LOCK_TICKS; i += 1) {
      move({ type: 'turn', direction: 'right' })
      expect(tank.direction).toBe('up')
    }
    expect(tank.y).toBeCloseTo(128 - (LOCK_TICKS + 1) * STEP, 5)
    expect(tank.slide).toBeLessThanOrEqual(SNOW_SLIDE_LOCK)
    move({ type: 'turn', direction: 'right' })
    expect(tank.direction).toBe('right')
  })

  it('点按一次：走 1 步后滑满滑行量停下', () => {
    const { tank, move } = setup()
    move(FORWARD)
    for (let i = 0; i < 60; i += 1) move(null)
    expect(128 - tank.y).toBeCloseTo(STEP + SNOW_SLIDE_START, 5)
    expect(tank.slide).toBe(0)
  })

  it('解锁后按住前进：正常行驶，滑行量不变，履带转动', () => {
    const { tank, move } = setup()
    for (let i = 0; i < LOCK_TICKS + 1; i += 1) move(FORWARD)
    const slide = tank.slide
    const y = tank.y
    move(FORWARD)
    expect(tank.slide).toBe(slide)
    expect(tank.y).toBeCloseTo(y - STEP, 5)
    expect(tank.moving).toBe(true)
  })

  it('解锁后转向再松手：沿新朝向滑行，转向时坐标对齐到 8 的倍数', () => {
    const { tank, move } = setup()
    for (let i = 0; i < LOCK_TICKS + 1; i += 1) move(FORWARD)
    move({ type: 'turn', direction: 'right' })
    expect(tank.y % 8).toBe(0)
    const x = tank.x
    move(null)
    expect(tank.direction).toBe('right')
    expect(tank.x).toBeCloseTo(x + STEP, 5)
    expect(tank.moving).toBe(false)
  })

  it('滑行撞墙：位置不变，滑行量照样递减到 0', () => {
    const { tank, move } = setup({ '7,2': 'Bf' })
    move(FORWARD)
    expect(tank.y).toBe(128)
    for (let i = 0; i < Math.ceil(SNOW_SLIDE_START / STEP); i += 1) move(null)
    expect(tank.y).toBe(128)
    expect(tank.slide).toBe(0)
  })

  it('锁定期冲出冰面：立即恢复操控，剩余滑行量保留；回到冰面后重新锁定', () => {
    // 只有第 8 行（y 128~144）是雪
    const { tank, move } = setup({ '8,2': 'S' }, false)
    tank.y = 125
    move(FORWARD)
    while (tank.y + 8 >= 128) move(null)
    const slide = tank.slide
    expect(slide).toBeGreaterThan(SNOW_SLIDE_LOCK)
    const y = tank.y
    move(null)
    expect(tank.y).toBe(y)
    move({ type: 'turn', direction: 'right' })
    expect(tank.direction).toBe('right')
    expect(tank.slide).toBe(slide)

    tank.direction = 'down'
    tank.y = 130
    move({ type: 'turn', direction: 'left' })
    expect(tank.direction).toBe('down')
    expect(tank.y).toBeCloseTo(130 + STEP, 5)
  })

  it('剩余量不超过锁定线时回到冰面：按键正常行驶、不重新起滑，松手滑完剩余量', () => {
    const { tank, sounds, move } = setup()
    tank.slide = 5
    move(FORWARD)
    expect(sounds).toEqual([])
    expect(tank.slide).toBe(5)
    for (let i = 0; i < 20; i += 1) move(null)
    expect(tank.slide).toBe(0)
    expect(128 - tank.y).toBeCloseTo(STEP + 5, 5)
  })

  it('冰上被定身：按键不起滑，已有滑行量照样滑完；冰面外定身仍可转向', () => {
    const frozen = setup()
    frozen.tank.frozenTimeout = 1000
    frozen.move(FORWARD)
    expect(frozen.tank.slide).toBe(0)
    expect(frozen.tank.y).toBe(128)
    frozen.tank.slide = 5
    frozen.move(FORWARD)
    expect(frozen.tank.y).toBeCloseTo(128 - STEP, 5)

    const plain = setup({}, false)
    plain.tank.frozenTimeout = 1000
    plain.move({ type: 'turn', direction: 'left' })
    expect(plain.tank.direction).toBe('left')
  })

  it('普通地面与 applyInput 结果一致，不播音效', () => {
    const a = setup({}, false)
    const b = setup({}, false)
    const inputs: Array<Input | null> = [
      FORWARD,
      FORWARD,
      { type: 'turn', direction: 'left' },
      FORWARD,
      null,
    ]
    for (const input of inputs) {
      a.move(input)
      applyInput({ map: b.map, tanks: [], restrictedAreas: [] }, b.tank, input, TICK)
    }
    expect([a.tank.x, a.tank.y, a.tank.direction]).toEqual([b.tank.x, b.tank.y, b.tank.direction])
    expect(a.sounds).toEqual([])
    expect(a.tank.slide).toBe(0)
  })
})

describe('bullet 碰撞（MBR / 对撞求交）', () => {
  it('getMBR 取最小包含矩形', () => {
    expect(
      getMBR({ x: 0, y: 0, width: 3, height: 3 }, { x: 10, y: 5, width: 3, height: 3 }),
    ).toEqual({
      x: 0,
      y: 0,
      width: 13,
      height: 8,
    })
  })

  it('spreadBullet 沿垂直方向扩展', () => {
    resetBulletIds()
    const up = new Bullet({
      side: 'player',
      tankId: 1,
      direction: 'up',
      speed: 0.12,
      power: 1,
      x: 10,
      y: 10,
    })
    const r = spreadBullet(up)
    expect(r.width).toBeGreaterThan(3) // 横向扩展
  })

  it('并排同向飞行的子弹不相撞', () => {
    resetBulletIds()
    const make = (x: number, speed: number) => {
      const b = new Bullet({
        side: 'player',
        tankId: 1,
        direction: 'up',
        speed,
        power: 1,
        x,
        y: 100,
      })
      b.lastY = 102
      return b
    }
    expect(getBulletCollision(make(10, 0.12), make(12, 0.24), 17)).toBeNull()
  })

  it('对向飞行的子弹会相撞', () => {
    resetBulletIds()
    const b1 = new Bullet({
      side: 'player',
      tankId: 1,
      direction: 'up',
      speed: 0.12,
      power: 1,
      x: 10,
      y: 10,
    })
    b1.lastX = 10
    b1.lastY = 16
    const b2 = new Bullet({
      side: 'bot',
      tankId: 2,
      direction: 'down',
      speed: 0.12,
      power: 1,
      x: 10,
      y: 13,
    })
    b2.lastX = 10
    b2.lastY = 7
    expect(getBulletCollision(b1, b2, 33)).not.toBeNull()
  })
})

describe('bullet 命中坦克', () => {
  /** P1 的子弹正要打到下方的队友 */
  function shootMate(helmetDuration: number) {
    const mate = new Tank({ side: 'player', x: 96, y: 96, helmetDuration })
    const bullet = new Bullet({
      side: 'player',
      tankId: -1,
      direction: 'down',
      speed: 0.12,
      power: 1,
      x: 102,
      y: 90,
    })
    const bullets = [bullet]
    const explosions: never[] = []
    const hits: BulletTankHit[] = []
    const audio = { play: () => {} }
    updateBullets(bullets, makeMap(), explosions, audio, 100, [mate], hits)
    return { hits, bullets, explosions }
  }

  it('队友戴着头盔时子弹静默消失，不算命中', () => {
    const { hits, bullets, explosions } = shootMate(1000)
    expect(hits).toEqual([])
    expect(bullets).toEqual([])
    expect(explosions).toEqual([])
  })

  it('队友没戴头盔时算命中', () => {
    expect(shootMate(0).hits).toHaveLength(1)
  })

  it('来弹在炮口被对射抵消后，同一帧里不再打中玩家', () => {
    const tank = new Tank({ side: 'player', x: 80, y: 80, direction: 'right' })
    const incoming = new Bullet({
      side: 'bot',
      tankId: -1,
      direction: 'left',
      speed: 0.24,
      power: 2,
      x: 98,
      y: 86,
    })
    const bullets = [incoming]
    fireTank(tank, true, STEP_MS, bullets, { play: () => {} })
    const hits: BulletTankHit[] = []
    updateBullets(bullets, makeMap(), [], { play: () => {} }, STEP_MS, [tank], hits)
    expect(bullets).toEqual([])
    expect(hits).toEqual([])
  })
})

describe('AI 寻路（BFS）', () => {
  it('空地可达，路径首尾正确', () => {
    const spots = buildSpots(makeMap())
    const start = 5 * 26 + 5
    const target = 8 * 26 + 10
    const path = findPath(spots, start, target)
    expect(path).not.toBeNull()
    expect(path![0]).toBe(start)
    expect(path![path!.length - 1]).toBe(target)
  })

  it('目标不可通行时返回 null', () => {
    const spots = buildSpots(makeMap())
    expect(findPath(spots, 5 * 26 + 5, 0)).toBeNull() // t=0 为边界，canPass=false
  })
})

describe('PathFollower', () => {
  const TICK = 1000 / 60

  it('沿路径逐段转向、前进，走完返回 arrived 并停在目标 spot', () => {
    const map = makeMap()
    const world = { map, tanks: [] as Tank[], restrictedAreas: [] }
    const tank = new Tank({ side: 'bot', direction: 'down', x: 32, y: 32 })
    const target = 20 * 26 + 12
    const follower = new PathFollower()
    expect(follower.begin(tank, findPath(buildSpots(map), getTankSpot(tank), target))).toBe(true)
    let status = 'moving'
    for (let i = 0; i < 2000 && status === 'moving'; i += 1) {
      const result = follower.step(tank, TICK)
      applyInput(world, tank, result.move, TICK)
      status = result.status
    }
    expect(status).toBe('arrived')
    expect({ x: tank.x, y: tank.y }).toEqual(spotToTankPos(target))
  })

  it('连续 200ms 没有位移返回 blocked；冻结期间不计', () => {
    const map = makeMap()
    const tank = new Tank({ side: 'player', direction: 'up', x: 32, y: 32 })
    const path = findPath(buildSpots(map), getTankSpot(tank), 10 * 26 + 5)
    const follower = new PathFollower()
    follower.begin(tank, path)
    tank.frozenTimeout = 1000
    for (let i = 0; i < 30; i += 1) {
      expect(follower.step(tank, TICK).status).toBe('moving')
    }
    tank.frozenTimeout = 0
    // 12 个 tick 累加为 199.99…ms，第 13 个 tick 才超时
    const statuses: string[] = []
    for (let i = 0; i < 13; i += 1) statuses.push(follower.step(tank, TICK).status)
    expect(statuses.slice(0, 12).every((s) => s === 'moving')).toBe(true)
    expect(statuses[12]).toBe('blocked')
  })
})

describe('fire-estimate', () => {
  it('getAIFireCount 按砖数分档', () => {
    expect(
      getAIFireCount({ source: 0, target: 0, distance: 0, brickCount: 2, steelCount: 0 }),
    ).toBe(1)
    expect(
      getAIFireCount({ source: 0, target: 0, distance: 0, brickCount: 4, steelCount: 0 }),
    ).toBe(2)
    expect(
      getAIFireCount({ source: 0, target: 0, distance: 0, brickCount: 6, steelCount: 0 }),
    ).toBe(2)
  })
  it('getFireResist：钢块权重为 100', () => {
    expect(getFireResist({ source: 0, target: 0, distance: 0, brickCount: 1, steelCount: 1 })).toBe(
      101,
    )
  })
})

describe('expandBots', () => {
  it('展开为按序排列的等级队列', () => {
    expect(
      expandBots([
        { tankLevel: 'basic', count: 2 },
        { tankLevel: 'fast', count: 1 },
      ]),
    ).toEqual(['basic', 'basic', 'fast'])
  })
})

describe('ScorePopup', () => {
  it('延时结束后才显示，显示 48 帧后移除', () => {
    const f = 1000 / 60
    const popup = new ScorePopup(100, 0, 0, 36 * f)
    popup.advance(35 * f)
    expect(popup.visible).toBe(false)
    popup.advance(2 * f)
    expect(popup.visible).toBe(true)
    popup.advance(46 * f)
    expect(popup.done).toBe(false)
    popup.advance(2 * f)
    expect(popup.done).toBe(true)
  })
})
