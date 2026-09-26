import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { STEP_MS } from '../src/engine/Game'
import GameSession, { type PlayerConfig } from '../src/engine/GameSession'
import { PLAYER_SPAWN_POS } from '../src/engine/constants'
import { resetBulletIds } from '../src/engine/entities/Bullet'
import { resetTankIds } from '../src/engine/entities/Tank'
import { seededRandom } from '../src/engine/random'
import InputManager from '../src/input/InputManager'
import { PLAYER1_CONTROL, PLAYER2_CONTROL } from '../src/input/bindings'
import { getStageByName } from '../src/stages'

const P1: PlayerConfig = {
  control: PLAYER1_CONTROL,
  color: 'yellow',
  spawnPos: PLAYER_SPAWN_POS.player1,
}
const P2: PlayerConfig = {
  control: PLAYER2_CONTROL,
  color: 'green',
  spawnPos: PLAYER_SPAWN_POS.player2,
}

/**
 * 固定种子、玩家不操作，逐 tick 记录全部坦克与子弹。重构 AI 驱动方式时，轨迹必须不变；
 * 轨迹变了要先找出原因，不能直接更新快照
 */
function recordTrace(stageName: string, players: PlayerConfig[], seed: number, ms: number) {
  resetTankIds()
  resetBulletIds()
  const session = new GameSession(
    [getStageByName(stageName)!],
    0,
    players,
    { play: () => {} },
    { autopilot: false, random: seededRandom(seed) },
  )
  const input = new InputManager()
  const hash = createHash('sha1')
  const samples: string[] = []
  let tick = 0
  for (let t = 0; t < ms && session.phase !== 'ended'; t += STEP_MS) {
    session.step(STEP_MS, input)
    input.endTick()
    tick += 1
    const scene = session.scene
    if (scene == null) continue
    const tanks = scene.tanks.map(
      (tank) => `${tank.tankId}:${tank.x.toFixed(3)},${tank.y.toFixed(3)},${tank.direction[0]}`,
    )
    const bullets = scene.bullets.map((b) => `${b.bulletId}:${b.x.toFixed(2)},${b.y.toFixed(2)}`)
    const line = `${session.phase} ${tanks.join(' ')} | ${bullets.join(' ')}`
    hash.update(line + '\n')
    if (tick % 120 === 0) samples.push(`${tick} ${line}`)
  }
  return { hash: hash.digest('hex'), samples }
}

describe('BotBrain 轨迹回归', () => {
  it('单人第 1 关 60s', () => {
    expect(recordTrace('1', [P1], 1, 60_000)).toMatchSnapshot()
  })

  it('双人第 5 关 60s', () => {
    expect(recordTrace('5', [P1, P2], 2, 60_000)).toMatchSnapshot()
  })
})
