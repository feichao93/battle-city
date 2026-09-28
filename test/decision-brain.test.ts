import { describe, expect, it } from 'vitest'
import type { AIContext } from '../src/engine/ai/controller'
import DecisionBrain from '../src/engine/ai/decision-brain'
import type { DecisionAnswers, DecisionRequest } from '../src/engine/ai/decision'
import { observe } from '../src/engine/ai/observation'
import { buildPrompt } from '../src/engine/ai/prompt'
import { buildSpots } from '../src/engine/ai/spots'
import Bullet from '../src/engine/entities/Bullet'
import Tank from '../src/engine/entities/Tank'
import TerrainMap from '../src/engine/map/TerrainMap'
import type { Direction } from '../src/engine/types'
import { answers, makeStage } from './helpers'

/** 空地图：玩家在 (64,160)，bot 在它正上方 (64,32)；overrides 同 makeStage */
function scene(facing: Direction = 'up', overrides: Record<string, string> = {}) {
  const map = TerrainMap.fromRaw(makeStage('t', ['1*basic'], overrides))
  const me = new Tank({ side: 'player', x: 64, y: 160, direction: facing })
  const bot = new Tank({ side: 'bot', x: 64, y: 32, direction: 'down' })
  const tanks = [me, bot]
  const ctx: AIContext = {
    world: { map, tanks, restrictedAreas: [] },
    map,
    tanks,
    bullets: [],
    powerUps: [],
    spots: buildSpots(map),
    random: () => 0,
    time: 0,
    stageNumber: 1,
    remainingBots: 3,
    players: [me],
    pilots: ['autopilot'],
  }
  return { me, bot, ctx }
}

/** 手动控制每次请求何时、以什么结果返回 */
function manualClient() {
  const calls: {
    request: DecisionRequest
    resolve: (a: DecisionAnswers) => void
    reject: () => void
  }[] = []
  const client = (request: DecisionRequest) =>
    new Promise<DecisionAnswers>((resolve, reject) => {
      calls.push({ request, resolve, reject: () => reject(new Error('boom')) })
    })
  return { calls, client }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('observe', () => {
  it('地图标出自己，给出各方向能否前进和炮口前的东西', () => {
    const { me, ctx } = scene('up', { '10,3': 'Bf' })
    const state = observe(me, ctx, [])
    expect(state.map).toHaveLength(26)
    expect(state.map[20].slice(8, 10)).toBe('M^')
    expect(state.me).toMatchObject({ col: 8, row: 20, facing: 'up', stars: 0 })
    expect(state.lanes.up.hit).toBe('bot')
    expect(state.moves.up).toBe('free')
    // 左边 (10,3) 这块砖挡着
    expect(state.moves.left).toBe('brick')
    expect(state.bots).toEqual([
      expect.objectContaining({ dx: 0, dy: -16, level: 'basic', aimingAtMe: true }),
    ])
    expect(state.eagle).toEqual({ dx: 4, dy: 4, broken: false })
    expect(state.remainingBots).toBe(3)
  })

  it('朝老鹰方向开火时 lanes 标出 eagle', () => {
    const map = TerrainMap.fromRaw(makeStage('t'))
    const me = new Tank({ side: 'player', x: 96, y: 144, direction: 'down' })
    const { ctx } = scene()
    const state = observe(me, { ...ctx, map, tanks: [me], players: [me] }, [])
    expect(state.lanes.down.hit).toBe('eagle')
  })
})

describe('buildPrompt', () => {
  it('走得通才给 move_*，旁边有空路靠近目标时不给打砖，能打到 bot 才给 face_*', () => {
    const { me, ctx } = scene('left', { '10,3': 'Bf' })
    const { text, questions } = buildPrompt(observe(me, ctx, []))
    expect(text).toContain('敌方坦克1：在你上方8格，朝下，正瞄准你')
    expect(questions.action.type === 'choice' && Object.keys(questions.action.criteria)).toEqual([
      'move_up',
      'face_up',
      'move_down',
      'move_right',
    ])
    expect(questions.fire_left.instructions).toContain('朝左开火会先打穿砖墙（约4枪），再打到')
    expect(questions.fire_up.instructions).toContain('朝上开火会打到7格外的敌方坦克')
  })

  it('state 依次是游戏规则、局面描述、原始 JSON', () => {
    const { me, ctx } = scene()
    const { text } = buildPrompt(observe(me, ctx, []))
    const parts = ['游戏规则（坦克大战）', '局面：', '原始数据（你是 me）：', '"terrain": [']
    const at = parts.map((p) => text.indexOf(p))
    expect(at.every((i) => i >= 0)).toBe(true)
    expect(at).toEqual([...at].sort((a, b) => a - b))
    expect(text).toContain('"me": {"col":8,"row":20,"direction":"up"')
  })

  it('来弹写明多久打到、往哪边躲来不来得及、能不能迎面抵消', () => {
    // 砖在 bot 和我之间；子弹已经过了砖，从正上方飞来
    const { me, ctx } = scene('up', { '5,4': 'Bf' })
    const bullet = new Bullet({
      side: 'bot',
      tankId: 99,
      direction: 'down',
      speed: 0.12,
      power: 1,
      x: 70,
      y: 120,
    })
    const { text, questions } = buildPrompt(observe(me, { ...ctx, bullets: [bullet] }, []))
    expect(text).toContain('正瞄准你（中间隔着砖墙）')
    expect(text).toContain(
      '危险：一颗敌方子弹从上方飞来，0.31秒后打中你；往左开0.22秒能让开（来不及）；' +
        '往右开0.20秒能让开（来不及）；朝上开火能迎面抵消它。',
    )
    expect(questions.fire_up.instructions).toContain('迎面撞上飞来的敌方子弹')
  })
})

describe('buildPrompt 射线', () => {
  it('错开半格也按精确位置写出双方能不能打到对方', () => {
    const { me, bot, ctx } = scene('up')
    bot.x = 72
    const { text } = buildPrompt(observe(me, ctx, []))
    expect(text).toContain(
      '敌方坦克1：在你上方8格、右方0.5格，朝下，正瞄准你（中间没有遮挡），' +
        '它随时可以开火，开火后0.93秒打到你，你朝上开火能打到它',
    )
  })

  it('移动选项写明走一步后会不会进入 bot 的射线；掉头单独标出', () => {
    const { me, bot, ctx } = scene('up')
    // 现在打不到我，往右走一步就进了它的射线
    bot.x = 80
    const { questions } = buildPrompt(observe(me, ctx, ['move_left']))
    const criteria = questions.action.type === 'choice' ? questions.action.criteria : {}
    expect(criteria.move_right).toMatch(
      /^【安全】掉头朝右开动.*会进入敌方坦克1（正对着它的炮口）的射线/,
    )
    expect(criteria.move_left).not.toContain('射线')
  })

  it('已经在射线上时，往射线里走写「仍在」，走出去写「离开射线」', () => {
    const { me, bot, ctx } = scene('up')
    bot.x = 72
    const { questions } = buildPrompt(observe(me, ctx, []))
    const criteria = questions.action.type === 'choice' ? questions.action.criteria : {}
    expect(criteria.move_up).toContain('仍在敌方坦克1（正对着它的炮口）的射线上')
    expect(criteria.move_left).toContain('离开射线')
  })
})

describe('buildPrompt 危险标签', () => {
  it('贴近正对着我、随时能开火的 bot：停在原地的选项标危险，靠近写「更贴近」', () => {
    const { me, bot, ctx } = scene('up')
    // 正上方隔一格，子弹 16px / 0.12 ≈ 0.13 秒就到
    bot.y = 128
    const { questions } = buildPrompt(observe(me, ctx, []))
    const criteria = questions.action.type === 'choice' ? questions.action.criteria : {}
    expect(criteria.face_up).toMatch(
      /^【危险：正对着敌方坦克1的炮口前，它随时能开火，子弹0\.13秒就到】/,
    )
    // 它离老鹰 6 格，同时被标成逼近老鹰，成为要打的目标
    expect(criteria.move_down).toContain('和逼近老鹰的敌方坦克拉开距离')
    expect(buildPrompt(observe(me, ctx, [])).text).toContain('正在逼近老鹰（离老鹰6格）。')
  })
})

describe('buildPrompt 去掉危险选项', () => {
  it('有安全选项时不给危险的', () => {
    const { me, bot, ctx } = scene('up')
    // 错开半格贴在上方：原地转向对射危险，往左让开一步就安全
    bot.x = 72
    bot.y = 128
    const { questions } = buildPrompt(observe(me, ctx, []))
    const criteria = questions.action.type === 'choice' ? questions.action.criteria : {}
    expect(criteria.face_up).toBeUndefined()
    expect(criteria.move_left).toMatch(/^【安全】/)
    expect(Object.values(criteria).every((t) => t.startsWith('【安全】'))).toBe(true)
  })
})

describe('buildPrompt 历史', () => {
  it('最近几步连续相同的合并成 ×N', () => {
    const { me, ctx } = scene()
    const { text } = buildPrompt(observe(me, ctx, ['move_left', 'move_left', 'move_right']))
    expect(text).toContain('你最近几步（从早到晚）：朝左开动×2 → 朝右开动。')
  })
})

describe('DecisionBrain', () => {
  it('同一时刻只有一个请求在飞；结果在下一 tick 生效，按 action 转向或前进', async () => {
    const { me, ctx } = scene('left')
    const { calls, client } = manualClient()
    const brain = new DecisionBrain(0, client)
    expect(brain.move(me, ctx)).toBeNull()
    expect(brain.move(me, { ...ctx, time: 16 })).toBeNull()
    expect(calls).toHaveLength(1)
    expect(calls[0].request).toMatchObject({ player: 0, time: 0 })

    calls[0].resolve(answers('move_up', 0.9))
    await flush()
    expect(brain.move(me, { ...ctx, time: 32 })).toEqual({ type: 'turn', direction: 'up' })
    expect(brain.fire(me)).toBe(true)
    me.direction = 'up'
    expect(brain.move(me, { ...ctx, time: 48 })).toEqual({ type: 'forward' })
    // 距上次发出不到 DECISION_INTERVAL，先不发
    expect(calls).toHaveLength(1)
    brain.move(me, { ...ctx, time: 140 })
    expect(calls).toHaveLength(2)
    expect(calls[1].request.state.recentActions).toEqual(['move_up'])
  })

  it('反向开动没有明显更好时不掉头', async () => {
    const { me, ctx } = scene('left')
    const { calls, client } = manualClient()
    const brain = new DecisionBrain(0, client)
    brain.move(me, ctx)
    calls[0].resolve(answers('move_left'))
    await flush()
    brain.move(me, { ...ctx, time: 150 })
    const close = answers('move_right')
    close.action.probabilities = { move_left: 0.4, move_right: 0.5 }
    calls[1].resolve(close)
    await flush()
    expect(brain.move(me, { ...ctx, time: 166 })).toEqual({ type: 'forward' })

    brain.move(me, { ...ctx, time: 300 })
    const clear = answers('move_right')
    clear.action.probabilities = { move_left: 0.2, move_right: 0.7 }
    calls[2].resolve(clear)
    await flush()
    expect(brain.move(me, { ...ctx, time: 316 })).toEqual({ type: 'turn', direction: 'right' })
  })

  it('往返超过 DECISION_INTERVAL 时，结果一到就发下一次', async () => {
    const { me, ctx } = scene()
    const { calls, client } = manualClient()
    const brain = new DecisionBrain(0, client)
    brain.move(me, ctx)
    calls[0].resolve(answers('stay'))
    await flush()
    brain.move(me, { ...ctx, time: 150 })
    expect(calls).toHaveLength(2)
    expect(calls[1].request.time).toBe(150)
  })

  it('按当前朝向那个方向的 fire_* 开火：转向和开火在同一次决策里完成', async () => {
    const { me, ctx } = scene('left')
    const { calls, client } = manualClient()
    const brain = new DecisionBrain(0, client)
    brain.move(me, ctx)
    calls[0].resolve(answers('face_up', { up: 0.9, left: 0.1 }))
    await flush()
    expect(brain.move(me, { ...ctx, time: 16 })).toEqual({ type: 'turn', direction: 'up' })
    expect(brain.fire(me)).toBe(false)
    me.direction = 'up'
    expect(brain.fire(me)).toBe(true)
  })

  it('face_* 只转向不前进；fire 的 P(yes) 不过半不开火', async () => {
    const { me, ctx } = scene('up')
    const { calls, client } = manualClient()
    const brain = new DecisionBrain(0, client)
    brain.move(me, ctx)
    calls[0].resolve(answers('face_up', 0.4))
    await flush()
    expect(brain.move(me, { ...ctx, time: 16 })).toBeNull()
    expect(brain.fire(me)).toBe(false)
  })

  it('选了朝砖墙开动：转过去之后开火打砖，fire 答否也开', async () => {
    const { me, ctx } = scene('up', { '10,3': 'Bf' })
    const { calls, client } = manualClient()
    const brain = new DecisionBrain(0, client)
    brain.move(me, ctx)
    expect(calls[0].request.state.moves.left).toBe('brick')
    calls[0].resolve(answers('move_left', 0))
    await flush()
    expect(brain.move(me, { ...ctx, time: 16 })).toEqual({ type: 'turn', direction: 'left' })
    expect(brain.fire(me)).toBe(false)
    me.direction = 'left'
    expect(brain.fire(me)).toBe(true)
  })

  it('请求失败或超时就停下不开火，迟到的结果丢弃', async () => {
    const { me, ctx } = scene('up')
    const { calls, client } = manualClient()
    const brain = new DecisionBrain(0, client)
    brain.move(me, ctx)
    calls[0].resolve(answers('move_up', 1))
    await flush()
    brain.move(me, { ...ctx, time: 16 })
    brain.move(me, { ...ctx, time: 200 })
    calls[1].reject()
    await flush()
    expect(brain.move(me, { ...ctx, time: 216 })).toBeNull()
    expect(brain.fire(me)).toBe(false)

    brain.move(me, { ...ctx, time: 400 })
    expect(calls).toHaveLength(3)
    brain.move(me, { ...ctx, time: 1500 })
    // 超时作废，同一 tick 立刻发下一次
    expect(calls).toHaveLength(4)
    calls[2].resolve(answers('move_up', 1))
    await flush()
    expect(brain.move(me, { ...ctx, time: 1516 })).toBeNull()
  })
})
