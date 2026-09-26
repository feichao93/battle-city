import { describe, expect, it } from 'vitest'
import { STEP_MS } from '../src/engine/Game'
import GameSession from '../src/engine/GameSession'
import { botSpawnInterval, frame, PLAYER_SPAWN_POS } from '../src/engine/constants'
import InputManager from '../src/input/InputManager'
import { PLAYER1_CONTROL, PLAYER2_CONTROL } from '../src/input/bindings'
import type { PlayerConfig } from '../src/engine/GameSession'
import type { RawStageConfig, SoundName } from '../src/engine/types'

/** overrides 以 "row,col" 指定地形编码，其余为空地，(12, 6) 为老鹰 */
function makeStage(
  name: string,
  bots: string[] = ['1*basic'],
  overrides: Record<string, string> = {},
): RawStageConfig {
  const map: string[] = []
  for (let row = 0; row < 13; row += 1) {
    const items: string[] = []
    for (let col = 0; col < 13; col += 1) {
      items.push(overrides[`${row},${col}`] ?? (row === 12 && col === 6 ? 'E' : 'X'))
    }
    map.push(items.join(' '))
  }
  return { name, difficulty: 1, map, bots }
}

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

function setup(stages: RawStageConfig[], players = [P1]) {
  const sounds: SoundName[] = []
  const session = new GameSession(stages, 0, players, { play: (name) => sounds.push(name) })
  const input = new InputManager()
  const run = (ms: number) => {
    for (let t = 0; t < ms; t += STEP_MS) {
      session.step(STEP_MS, input)
      input.endTick()
    }
  }
  return { session, sounds, run, input }
}

/** 推进到本关开战 */
function runUntilPlaying(session: GameSession, run: (ms: number) => void) {
  while (session.phase !== 'playing') {
    run(STEP_MS)
  }
}

/** 推进到玩家和首个 bot 都走完出生闪烁 */
function runUntilSpawned(session: GameSession, run: (ms: number) => void) {
  const tanks = () => session.scene!.tanks
  while (!tanks().some((t) => t.side === 'player') || !tanks().some((t) => t.side === 'bot')) {
    run(STEP_MS)
  }
}

function killAllBots(session: GameSession) {
  for (const t of session.scene!.tanks) {
    if (t.side === 'bot') t.alive = false
  }
}

describe('GameSession', () => {
  it('入场幕布：合拢后载入地图并播放 stage_start，展开后开战', () => {
    const { session, sounds, run } = setup([makeStage('1')])
    expect(session.phase).toBe('enter')
    expect(session.scene).toBeNull()

    run(250)
    expect(session.curtain).toBeGreaterThan(0.4)
    expect(session.curtain).toBeLessThan(1)
    expect(session.scene).toBeNull()

    run(600)
    expect(session.curtain).toBe(1)
    expect(session.scene).not.toBeNull()
    expect(sounds).toContain('stage_start')
    // 幕布展开前玩家还没出生
    expect(session.scene!.tanks).toHaveLength(0)

    runUntilPlaying(session, run)
    expect(session.curtain).toBe(0)
    expect(session.hudVisible).toBe(true)
    expect(session.players[0].lives).toBe(2)
  })

  it('过关：延时 4s → 结算 → 下一关，存活坦克等级与分数跨关保留且不扣命', () => {
    const { session, run } = setup([makeStage('1'), makeStage('2')])
    runUntilPlaying(session, run)
    runUntilSpawned(session, run)
    const player = session.scene!.tanks.find((t) => t.side === 'player')!
    player.level = 'power'
    session.players[0].score = 1200
    killAllBots(session)

    run(3900)
    expect(session.phase).toBe('playing')
    run(200)
    expect(session.phase).toBe('statistics')
    expect(session.hudVisible).toBe(false)

    while (session.phase === 'statistics') run(STEP_MS)
    expect(session.phase).toBe('enter')
    expect(session.stageIndex).toBe(1)
    expect(session.players[0].reservedTankLevel).toBe('power')

    runUntilPlaying(session, run)
    runUntilSpawned(session, run)
    const next = session.scene!.tanks.find((t) => t.side === 'player')!
    expect(next.level).toBe('power')
    expect(session.players[0].lives).toBe(2)
    expect(session.players[0].score).toBe(1200)
    expect(session.players[0].reservedTankLevel).toBeNull()
  })

  it('通关：最后一关结算完直接进入 ended，不播 GAME OVER', () => {
    const { session, sounds, run } = setup([makeStage('1')])
    runUntilPlaying(session, run)
    runUntilSpawned(session, run)
    killAllBots(session)
    run(4100)
    while (session.phase === 'statistics') run(STEP_MS)
    expect(session.phase).toBe('ended')
    expect(session.cleared).toBe(true)
    expect(sounds).not.toContain('game_over')
  })

  it('老鹰被毁：不进结算，直接播放 GAME OVER，结束后进入 ended', () => {
    const { session, sounds, run } = setup([makeStage('1')])
    runUntilPlaying(session, run)
    session.scene!.map.eagleBroken = true
    run(STEP_MS)
    expect(session.phase).toBe('gameover')
    expect(sounds).toContain('game_over')
    expect(session.statistics).toBeNull()

    run(1000)
    expect(session.gameoverProgress).toBeCloseTo(0.5, 1)
    run(1600)
    expect(session.phase).toBe('ended')
  })

  it('结算：按等级逐行递增击杀数，最后显示 TOTAL', () => {
    const { session, sounds, run } = setup([makeStage('1')])
    runUntilPlaying(session, run)
    runUntilSpawned(session, run)
    session.scene!.killInfo[0].fast = 3
    killAllBots(session)
    run(4000 + STEP_MS)
    expect(session.phase).toBe('statistics')
    const view = session.statistics!
    expect(view.counts[0].basic).toBe(-1)

    run(760)
    expect(view.counts[0].basic).toBe(0)
    expect(view.counts[0].fast).toBe(-1)

    // 上一行结束后还有 200ms + 250ms 才开始播放下一行
    run(400)
    expect(view.counts[0].fast).toBe(-1)
    while (view.counts[0].fast === -1) run(STEP_MS)
    expect(view.counts[0].fast).toBe(1)
    run(160)
    expect(view.counts[0].fast).toBe(2)
    run(160)
    expect(view.counts[0].fast).toBe(3)
    expect(view.showTotal).toBe(false)

    while (!view.showTotal) run(STEP_MS)
    expect(view.counts[0]).toEqual({ basic: 0, fast: 3, power: 0, armor: 0 })
    // basic/power/armor 各 1 声 + fast 3 声 + TOTAL 1 声
    expect(sounds.filter((s) => s === 'statistics_1')).toHaveLength(7)
  })

  it('出生：闪烁播完坦克才进入战场，玩家带头盔；bot 开局立即出生', () => {
    const { session, run } = setup([makeStage('1', ['3*basic'])])
    runUntilPlaying(session, run)
    const scene = session.scene!
    run(STEP_MS)
    expect(scene.tanks).toHaveLength(0)
    expect(scene.flickers).toHaveLength(2)
    expect(scene.remainingBotCount).toBe(2)

    // 玩家闪烁 37 帧 ≈ 617ms；bot 闪烁 56 帧 ≈ 933ms
    run(580)
    expect(scene.tanks).toHaveLength(0)
    run(50)
    const player = scene.tanks.find((t) => t.side === 'player')!
    expect(player.helmetDuration).toBeGreaterThan(0)
    expect(scene.tanks.some((t) => t.side === 'bot')).toBe(false)
    run(320)
    expect(scene.tanks.filter((t) => t.side === 'bot')).toHaveLength(1)
  })

  it('bot 出生：按间隔轮流使用 中 → 右 → 左 出生点，同屏最多 4 辆', () => {
    const { session, run } = setup([makeStage('1', ['6*basic'])])
    runUntilPlaying(session, run)
    const scene = session.scene!
    const spawnXs: number[] = []
    const seen = new Set<number>()
    const runAndRecord = (ms: number) => {
      for (let t = 0; t < ms; t += STEP_MS) {
        run(STEP_MS)
        // 清掉子弹，避免 bot 随机开火打掉老鹰提前结束对局
        scene.bullets.length = 0
        for (const f of scene.flickers) {
          if (f.tank.side === 'bot' && !seen.has(f.id)) {
            seen.add(f.id)
            spawnXs.push(f.x)
          }
        }
      }
    }

    // 第 1 关单人出生间隔 186 帧 = 3100ms
    runAndRecord(3000)
    expect(spawnXs).toEqual([96])
    runAndRecord(200)
    expect(spawnXs).toEqual([96, 192])
    runAndRecord(3100)
    expect(spawnXs).toEqual([96, 192, 0])

    // 第 4 辆出生后满员，之后不再出生
    runAndRecord(10_000)
    expect(spawnXs).toEqual([96, 192, 0, 96])
    expect(scene.remainingBotCount).toBe(2)
  })

  it('bot 出生间隔：190 − 4 × 关卡号帧，双人减 20，第 35 关之后不再缩短', () => {
    expect(botSpawnInterval(1, false)).toBeCloseTo(frame(186))
    expect(botSpawnInterval(1, true)).toBeCloseTo(frame(166))
    expect(botSpawnInterval(35, false)).toBeCloseTo(frame(50))
    expect(botSpawnInterval(50, false)).toBeCloseTo(frame(50))
  })

  it('最后一条命正在出生时不判负', () => {
    const { session, run } = setup([makeStage('1')])
    session.players[0].lives = 1
    runUntilPlaying(session, run)
    expect(session.players[0].lives).toBe(0)
    run(300)
    expect(session.scene!.status).toBe('playing')
  })

  it('双人：没命的玩家按开火键向队友借命', () => {
    const { session, run, input } = setup([makeStage('1')], [P1, P2])
    runUntilPlaying(session, run)
    runUntilSpawned(session, run)
    const scene = session.scene!
    session.players[0].lives = 0
    scene['killPlayer'](scene['players'][0])
    run(1000)
    expect(scene['players'][0].flicker).toBeNull()
    expect(scene.status).toBe('playing')
    expect(scene.canBorrowLife).toEqual([true, false])

    input.attach()
    document.dispatchEvent(new KeyboardEvent('keydown', { code: PLAYER1_CONTROL.fire }))
    run(STEP_MS)
    document.dispatchEvent(new KeyboardEvent('keyup', { code: PLAYER1_CONTROL.fire }))
    input.detach()
    expect(session.players[1].lives).toBe(1)
    expect(session.players[0].lives).toBe(0)
    expect(scene['players'][0].flicker).not.toBeNull()
    expect(scene.canBorrowLife).toEqual([false, false])
  })

  it('冰面滑行：P1 在雪地上点按一次方向键，松开后继续滑行', () => {
    // P1 出生点在第 12 行第 4 列，向上铺 4 格雪
    const snow = { '9,4': 'S', '10,4': 'S', '11,4': 'S', '12,4': 'S' }
    const { session, sounds, run, input } = setup([makeStage('1', ['1*basic'], snow)])
    runUntilPlaying(session, run)
    runUntilSpawned(session, run)
    const tank = session.scene!.tanks.find((t) => t.side === 'player')!
    const y = tank.y

    input.attach()
    document.dispatchEvent(new KeyboardEvent('keydown', { code: PLAYER1_CONTROL.up }))
    run(STEP_MS)
    document.dispatchEvent(new KeyboardEvent('keyup', { code: PLAYER1_CONTROL.up }))
    input.detach()
    expect(sounds).toContain('snow_slide')

    run(1000)
    expect(y - tank.y).toBeCloseTo(0.75 + 28, 1)
  })
})
