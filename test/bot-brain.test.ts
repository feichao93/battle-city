import { describe, expect, it } from 'vitest'
import BotBrain from '../src/engine/ai/bot-brain'
import type { AIContext } from '../src/engine/ai/controller'
import { buildSpots } from '../src/engine/ai/spots'
import { STEP_MS } from '../src/engine/Game'
import Tank from '../src/engine/entities/Tank'
import TerrainMap from '../src/engine/map/TerrainMap'
import { seededRandom } from '../src/engine/random'
import { makeStage, runUntilPlaying, setup } from './helpers'

describe('BotBrain 打砖', () => {
  it('出生的地方被一整排砖隔开时，会打砖出来进攻老鹰', () => {
    const wall: Record<string, string> = {}
    for (let col = 0; col < 13; col += 1) wall[`2,${col}`] = 'Bf'
    for (const seed of [1, 2, 3]) {
      const { session, run } = setup([makeStage('1', ['1*basic'], wall)])
      session['options'].random = seededRandom(seed)
      runUntilPlaying(session, run)
      let escaped = false
      for (let elapsed = 0; elapsed < 30_000 && !escaped; elapsed += 100) {
        run(100)
        escaped = session.scene!.tanks.some((t) => t.side === 'bot' && t.y > 48)
      }
      expect(escaped, `seed ${seed}`).toBe(true)
    }
  })
})

/** 空地图上 bot 朝上、玩家在它左边同一行；random 恒为 0，概率判定一定命中 */
function emptyScene(time: number, overrides: Record<string, string> = {}) {
  const map = TerrainMap.fromRaw(makeStage('t', ['1*basic'], overrides))
  const bot = new Tank({ side: 'bot', x: 96, y: 96, direction: 'up' })
  const player = new Tank({ side: 'player', x: 32, y: 96, direction: 'right' })
  const tanks = [bot, player]
  const ctx: AIContext = {
    world: { map, tanks, restrictedAreas: [] },
    map,
    tanks,
    bullets: [],
    powerUps: [],
    spots: buildSpots(map),
    random: () => 0,
    time,
    stageNumber: 1,
    players: [player],
    pilots: ['human'],
  }
  const brain = new BotBrain()
  brain.move(bot, ctx, STEP_MS) // 规划路线，进入 following
  brain.fire(bot, ctx, 300) // 开火判定
  return { brain, bot, ctx }
}

describe('BotBrain 进攻老鹰', () => {
  it('开局只游荡，一段时间后才规划去打老鹰', () => {
    expect(emptyScene(0).brain['goalIsEagle']).toBe(false)
    expect(emptyScene(60_000).brain['goalIsEagle']).toBe(true)
  })
})

describe('BotBrain 转身打侧面的玩家', () => {
  it('开局一段时间后，侧面近处的玩家会被转过去打', () => {
    const { brain, bot, ctx } = emptyScene(60_000)
    expect(brain.move(bot, ctx, STEP_MS)).toEqual({ type: 'turn', direction: 'left' })
    bot.direction = 'left'
    expect(brain.move(bot, ctx, STEP_MS)).toBe(null)
    expect(brain.fire(bot, ctx, STEP_MS)).toBe(true)
  })

  it('开局时不转；中间隔着钢墙也不转', () => {
    expect(emptyScene(0).brain['aimDirection']).toBe(null)
    expect(emptyScene(60_000, { '6,4': 'Tf' }).brain['aimDirection']).toBe(null)
  })
})

describe('BotBrain 打到老鹰外墙之后', () => {
  it('3s 内不朝老鹰开火，朝别处照开', () => {
    const { brain, bot, ctx } = emptyScene(0)
    brain.onBaseHit()
    bot.direction = 'down' // 老鹰在正下方
    expect(brain.fire(bot, ctx, 300)).toBe(false)
    bot.direction = 'left'
    expect(brain.fire(bot, ctx, 300)).toBe(true)
    brain.move(bot, ctx, 3000)
    bot.direction = 'down'
    expect(brain.fire(bot, ctx, 300)).toBe(true)
  })
})
