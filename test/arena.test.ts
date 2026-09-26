import { describe, it } from 'vitest'
import { STEP_MS } from '../src/engine/Game'
import GameSession, { type PlayerConfig } from '../src/engine/GameSession'
import { resetBulletIds } from '../src/engine/entities/Bullet'
import { resetTankIds } from '../src/engine/entities/Tank'
import { seededRandom } from '../src/engine/random'
import InputManager from '../src/input/InputManager'
import { stages } from '../src/stages'
import { P1, P2 } from './helpers'

/** 单局最长 10 分钟逻辑时间，超时按平局记 */
const TIME_LIMIT = 600_000
const SEEDS = Number(process.env.ARENA_SEEDS ?? 3)

type Outcome = 'win' | 'eagle' | 'dead' | 'timeout'

/** 全程不按键、开着托管：两边都是 AI，跑完一关 */
function play(stageIndex: number, players: PlayerConfig[], seed: number) {
  resetTankIds()
  resetBulletIds()
  const session = new GameSession(
    [stages[stageIndex]],
    0,
    players,
    { play: () => {} },
    { autopilot: true, random: seededRandom(seed) },
  )
  const input = new InputManager()
  let elapsed = 0
  while (session.phase !== 'ended' && elapsed < TIME_LIMIT) {
    session.step(STEP_MS, input)
    elapsed += STEP_MS
  }
  const scene = session.scene!
  const outcome: Outcome = session.cleared
    ? 'win'
    : session.phase !== 'ended'
      ? 'timeout'
      : scene.loseReason === 'eagle'
        ? 'eagle'
        : 'dead'
  return { outcome, seconds: Math.round(scene.time / 1000) }
}

/**
 * 托管 AI 的无头试打：pnpm arena。每关单人、双人各跑 ARENA_SEEDS 个种子，
 * 输出每关结果和总胜率，调 TeammateBrain 前后对比用
 */
describe.runIf(process.env.ARENA)('arena', () => {
  it('全部关卡 AI 对 AI', () => {
    const totals: Record<string, Record<Outcome, number>> = {}
    const rows: string[] = []
    const mark: Record<Outcome, string> = { win: 'W', eagle: 'E', dead: 'D', timeout: 'T' }
    stages.forEach((stage, i) => {
      const cells = [[P1], [P1, P2]].map((players) => {
        const key = `${players.length}P`
        totals[key] ??= { win: 0, eagle: 0, dead: 0, timeout: 0 }
        const results = Array.from({ length: SEEDS }, (_, seed) => play(i, players, seed + 1))
        for (const r of results) totals[key][r.outcome] += 1
        return `${key} ${results.map((r) => `${mark[r.outcome]}${String(r.seconds).padStart(4)}s`).join(' ')}`
      })
      rows.push(`stage ${stage.name.padStart(2)} | ${cells.join(' | ')}`)
    })
    for (const [key, t] of Object.entries(totals)) {
      const n = t.win + t.eagle + t.dead + t.timeout
      rows.push(
        `${key} win ${t.win}/${n} (${Math.round((100 * t.win) / n)}%) · eagle ${t.eagle} · dead ${t.dead} · timeout ${t.timeout}`,
      )
    }
    console.log(`W 通关 · E 老鹰被毁 · D 全灭 · T 超时\n${rows.join('\n')}`)
  }, 600_000)
})
