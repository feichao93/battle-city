import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import type { AIContext } from '../src/engine/ai/controller'
import { defenseRoutes } from '../src/engine/ai/defense'
import { brickInFront } from '../src/engine/ai/lane'
import { eagleReachSteps, eagleReachTime } from '../src/engine/ai/eagle-threat'
import {
  avoidAim,
  exposureCosts,
  holdBeforeAim,
  stepsIntoBullet,
} from '../src/engine/ai/self-defense'
import { buildSpots, getTankSpot, spotToTankPos } from '../src/engine/ai/spots'
import TeammateBrain from '../src/engine/ai/teammate-brain'
import { STEP_MS } from '../src/engine/Game'
import Bullet from '../src/engine/entities/Bullet'
import PowerUp from '../src/engine/entities/PowerUp'
import Tank from '../src/engine/entities/Tank'
import TerrainMap from '../src/engine/map/TerrainMap'
import { seededRandom } from '../src/engine/random'
import { stages } from '../src/stages'
import type { Direction, RawStageConfig } from '../src/engine/types'
import { makeStage, P1, P2, runUntilPlaying, setup } from './helpers'

/** 空地图（老鹰在第 12 行第 6 列），overrides 以 "row,col" 指定地形 */
function makeContext(tanks: Tank[], overrides: Record<string, string> = {}): AIContext {
  const map = TerrainMap.fromRaw(makeStage('t', ['1*basic'], overrides))
  return {
    world: { map, tanks, restrictedAreas: [] },
    map,
    tanks,
    bullets: [],
    powerUps: [],
    spots: buildSpots(map),
    random: seededRandom(1),
    time: 0,
    stageNumber: 1,
    players: tanks.filter((t) => t.side === 'player'),
    pilots: tanks.filter((t) => t.side === 'player').map(() => 'autopilot'),
  }
}

const player = (x: number, y: number, direction: Direction) =>
  new Tank({ side: 'player', x, y, direction })
const bot = (x: number, y: number) => new Tank({ side: 'bot', x, y })
const botBullet = (x: number, y: number, direction: Direction) =>
  new Bullet({ side: 'bot', tankId: -1, direction, speed: 0.12, power: 1, x, y })

describe('TeammateBrain 开火', () => {
  it('射线上先遇到 bot 才开火；老鹰在射线上、中间没有 bot 时不开火', () => {
    const me = player(96, 128, 'down')
    expect(new TeammateBrain().fire(me, makeContext([me]))).toBe(false)
    const target = bot(96, 32)
    const up = player(96, 128, 'up')
    expect(new TeammateBrain().fire(up, makeContext([up, target]))).toBe(true)
  })

  it('队友挡在 bot 前面不开火；队友在 bot 后面照常开火', () => {
    const me = player(32, 160, 'up')
    const target = bot(32, 32)
    expect(new TeammateBrain().fire(me, makeContext([me, target, player(33, 96, 'up')]))).toBe(
      false,
    )
    expect(new TeammateBrain().fire(me, makeContext([me, target, player(32, 0, 'up')]))).toBe(true)
  })

  it('打穿砖去打近处的 bot；bot 太远或要打穿老鹰外墙时不开火', () => {
    const me = player(32, 160, 'up')
    const near = bot(32, 80)
    expect(new TeammateBrain().fire(me, makeContext([me, near], { '7,2': 'Bf' }))).toBe(true)
    const far = bot(32, 0)
    expect(new TeammateBrain().fire(me, makeContext([me, far], { '7,2': 'Bf' }))).toBe(false)

    // 老鹰左边那列外墙（第 12 行第 5 列的右半）挡在射线上
    const left = player(48, 192, 'right')
    const behind = bot(160, 192)
    const ctx = makeContext([left, behind], { '12,5': 'Bf' })
    expect(new TeammateBrain().fire(left, ctx)).toBe(false)
  })
})

describe('打砖开路', () => {
  it('子弹一出膛就打到砖才算能打：砖只剩两边、或者是老鹰外墙都不行', () => {
    const map = TerrainMap.fromRaw(makeStage('t', ['1*basic'], { '6,2': 'Bf', '11,6': 'Bf' }))
    const below = { x: 32, y: 112 }
    expect(brickInFront(map, below, 'up')).toBe(true)
    // 打掉中间 8px，只剩坦克两边的砖：挡得住坦克，子弹却从中间穿过去
    map.removeBricks(map.brickIndicesIn({ x: 36.5, y: 96.5, width: 7, height: 15 }))
    expect(brickInFront(map, below, 'up')).toBe(false)

    expect(brickInFront(map, { x: 96, y: 160 }, 'down')).toBe(true)
    expect(brickInFront(map, { x: 96, y: 168 }, 'down')).toBe(false)
  })

  it('妨碍防守的砖：第 2 关老鹰正上方那排砖隔开了两侧的拦截位，第 1 关没有', () => {
    expect(defenseRoutes(TerrainMap.fromRaw(stages[0]))).toEqual([])
    const routes = defenseRoutes(TerrainMap.fromRaw(stages[1]))
    expect(routes.length).toBeGreaterThan(0)
    const aboveEagle = getTankSpot({ x: 96, y: 168 })
    for (const route of routes) expect(route).toContain(aboveEagle)
  })
})

describe('TeammateBrain 双人分工', () => {
  /** 各自跑一次规划，返回目标位置的 x */
  const goalX = (tanks: Tank[]) => {
    const ctx = makeContext(tanks)
    return ctx.players.map((me) => {
      const brain = new TeammateBrain()
      brain.move(me!, ctx, STEP_MS)
      return spotToTankPos(brain['goal']!.spot).x
    })
  }

  it('距离差不多时 P1 管左半场、P2 管右半场：两人站位对调，各自去打自己那半边的 bot', () => {
    const [x1, x2] = goalX([player(104, 160, 'up'), player(88, 160, 'up'), bot(0, 0), bot(192, 0)])
    expect(x1).toBe(0)
    expect(x2).toBe(192)
  })

  it('两个托管不抢同一个道具：只有离得近的去拿', () => {
    const tanks = [player(32, 160, 'up'), player(160, 160, 'up')]
    const ctx = { ...makeContext(tanks), powerUps: [new PowerUp('star', 48, 96)] }
    const [near, far] = ctx.players.map((me) => {
      const brain = new TeammateBrain()
      brain.move(me!, ctx, STEP_MS)
      const goal = spotToTankPos(brain['goal']!.spot)
      return Math.abs(goal.x - 48) + Math.abs(goal.y - 96)
    })
    expect(near).toBeLessThanOrEqual(16)
    expect(far).toBeGreaterThan(32)
  })

  it('没有 bot 时分守老鹰两侧', () => {
    const [x1, x2] = goalX([player(64, 192, 'up'), player(128, 192, 'up')])
    expect(x1).toBeLessThan(96)
    expect(x2).toBeGreaterThan(96)
  })
})

describe('TeammateBrain 自保', () => {
  it('来弹对得上炮口时转过去开火抵消；冷却中或戴着头盔时不理会', () => {
    const me = player(96, 128, 'right')
    const ctx = { ...makeContext([me]), bullets: [botBullet(102, 80, 'down')] }
    const brain = new TeammateBrain()
    expect(brain.move(me, ctx, STEP_MS)).toEqual({ type: 'turn', direction: 'up' })
    expect(brain.fire(me, ctx)).toBe(true)

    me.cooldown = 100
    expect(new TeammateBrain().move(me, ctx, STEP_MS)).not.toEqual({
      type: 'turn',
      direction: 'up',
    })
    me.cooldown = 0
    me.helmetDuration = 1000
    expect(new TeammateBrain().move(me, ctx, STEP_MS)).not.toEqual({
      type: 'turn',
      direction: 'up',
    })
  })

  it('往前走会正好撞上横穿过来的子弹时停下；子弹已经过去、或者中间有砖挡着就照走', () => {
    const me = player(96, 128, 'up')
    const withBullet = (x: number, overrides: Record<string, string> = {}) => ({
      ...makeContext([me], overrides),
      bullets: [botBullet(x, 120, 'right')],
    })
    expect(stepsIntoBullet(me, withBullet(40))).toBe(true)
    expect(stepsIntoBullet(me, withBullet(120))).toBe(false)
    expect(stepsIntoBullet(me, withBullet(40, { '7,3': 'Bf' }))).toBe(false)
  })
})

describe('TeammateBrain 站位', () => {
  const facing = (x: number, y: number, direction: Direction, level: 'basic' | 'armor' = 'basic') =>
    new Tank({ side: 'bot', x, y, direction, level, hp: level === 'armor' ? 4 : 1 })

  it('armor 在近处正对着自己时横移出它的射线；1 血的 bot 对齐了就不用让', () => {
    const me = player(96, 96, 'up')
    const move = avoidAim(me, makeContext([me, facing(96, 64, 'down', 'armor')]))
    expect(move).toMatchObject({ type: 'turn' })
    expect(['left', 'right']).toContain((move as { direction: Direction }).direction)
    expect(avoidAim(me, makeContext([me, facing(96, 64, 'down')]))).toBeUndefined()
  })

  it('面对面错开 8px（双方都打得到、子弹又抵消不了）时横移到和 bot 对齐', () => {
    const me = player(104, 96, 'up')
    expect(avoidAim(me, makeContext([me, facing(96, 32, 'down')]))).toEqual({
      type: 'turn',
      direction: 'left',
    })
    const turned = player(104, 96, 'left')
    expect(avoidAim(turned, makeContext([turned, facing(96, 32, 'down')]))).toEqual({
      type: 'forward',
      maxDistance: 8,
    })
  })

  it('走到下一个格点就进入近处 bot 的射线时停在格点上等；它的子弹正在飞、或者离得远时直接过', () => {
    const shooter = facing(96, 32, 'down')
    const onGrid = player(80, 56, 'right')
    expect(holdBeforeAim(onGrid, makeContext([onGrid, shooter]), 'right')).toBe(null)
    // 前方的格点 88 已在射线里，退回 80
    const me = player(85.5, 56, 'right')
    expect(holdBeforeAim(me, makeContext([me, shooter]), 'right')).toEqual({
      type: 'turn',
      direction: 'left',
    })
    const early = player(72, 56, 'right')
    expect(holdBeforeAim(early, makeContext([early, shooter]), 'right')).toBe(undefined)
    const flying = new Bullet({
      side: 'bot',
      tankId: shooter.tankId,
      direction: 'down',
      speed: 0.12,
      power: 1,
      x: 102,
      y: 150,
    })
    expect(holdBeforeAim(me, { ...makeContext([me, shooter]), bullets: [flying] }, 'right')).toBe(
      undefined,
    )
    const far = player(85.5, 100, 'right')
    expect(holdBeforeAim(far, makeContext([far, shooter]), 'right')).toBe(undefined)
  })

  it('bot 炮口前面的格子按 bot 血量算代价，背后不算', () => {
    const costs = exposureCosts(makeContext([facing(96, 64, 'down', 'armor')]))
    expect(costs[getTankSpot({ x: 96, y: 112 })]).toBe(4)
    expect(costs[getTankSpot({ x: 96, y: 16 })]).toBe(0)
  })
})

describe('老鹰威胁', () => {
  it('已经和老鹰同列、中间没挡着的 bot 马上就能打到老鹰；远处的要走好几秒', () => {
    const near = bot(96, 112)
    const far = bot(0, 0)
    const ctx = makeContext([near, far])
    const steps = eagleReachSteps(ctx)
    expect(eagleReachTime(near, steps)).toBe(0)
    expect(eagleReachTime(far, steps)).toBeGreaterThan(2000)
  })
})

/** 不按键、开着托管，bot 冻结在出生点：AI 队友要自己走到射击位把它打掉 */
function runAutopilotStage(
  seed: number,
  stage: RawStageConfig = makeStage('1', ['2*basic']),
  players = [P1, P2],
) {
  const { session, run } = setup([stage], players, true)
  session['options'].random = seededRandom(seed)
  runUntilPlaying(session, run)
  session.scene!['botFreezeTicks'] = Infinity
  const hash = createHash('sha1')
  let elapsed = 0
  while (session.phase === 'playing' && session.scene!.status === 'playing' && elapsed < 30_000) {
    run(STEP_MS)
    elapsed += STEP_MS
    hash.update(session.scene!.tanks.map((t) => `${t.x},${t.y},${t.direction}`).join(' '))
  }
  return { session, elapsed, hash: hash.digest('hex') }
}

describe('TeammateBrain 驾驶', () => {
  it('托管的玩家会走到射击位，打掉冻结在出生点的 bot', () => {
    const { session, elapsed } = runAutopilotStage(1)
    expect(session.scene!.status).toBe('won')
    expect(elapsed).toBeLessThan(30_000)
    const kills = session.scene!.killInfo.map((k) => k.basic)
    expect(kills[0] + kills[1]).toBe(2)
  })

  it('被厚砖墙隔开时打穿砖墙过去', () => {
    // 第 2–7 行整排砖，比打穿砖开火的最远距离还厚，只能开路
    const wall: Record<string, string> = {}
    for (let row = 2; row <= 7; row += 1) {
      for (let col = 0; col < 13; col += 1) wall[`${row},${col}`] = 'Bf'
    }
    const { session } = runAutopilotStage(1, makeStage('1', ['1*basic'], wall), [P1])
    expect(session.scene!.status).toBe('won')
  })

  it('同一个种子跑两次，结果一致', () => {
    expect(runAutopilotStage(7).hash).toBe(runAutopilotStage(7).hash)
  })
})
