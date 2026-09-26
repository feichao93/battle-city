import { afterEach, describe, expect, it } from 'vitest'
import { STEP_MS } from '../src/engine/Game'
import type GameSession from '../src/engine/GameSession'
import type { PlayerConfig } from '../src/engine/GameSession'
import type InputManager from '../src/input/InputManager'
import { PLAYER1_CONTROL, PLAYER2_CONTROL } from '../src/input/bindings'
import type { RawStageConfig } from '../src/engine/types'
import { killAllBots, makeStage, P1, P2, runUntilPlaying, setup } from './helpers'

const CONTROLS = [PLAYER1_CONTROL, PLAYER2_CONTROL]
const key = (type: 'keydown' | 'keyup', code: string) =>
  document.dispatchEvent(new KeyboardEvent(type, { code }))

const attached: InputManager[] = []
afterEach(() => {
  for (const input of attached.splice(0)) input.detach()
})

function autopilotSetup(
  stages: RawStageConfig[],
  players: PlayerConfig[] = [P1],
  autopilot = true,
) {
  const ctx = setup(stages, players, autopilot)
  ctx.input.attach()
  attached.push(ctx.input)
  const { session, run } = ctx
  /** 按下再松开，并推进一个 tick */
  const tap = (code: string) => {
    key('keydown', code)
    key('keyup', code)
    run(STEP_MS)
  }
  /** 推进到本关所有玩家都能操作；bot 冻结，免得打死玩家打乱计时 */
  const runUntilControllable = () => {
    runUntilPlaying(session, run)
    freezeBots(session)
    while (!session.players.every((_, i) => session.scene!.controllable(i))) run(STEP_MS)
  }
  /** 打完本关，推进到下一关开战后玩家能操作 */
  const finishStage = (beforeNext: () => void = () => {}) => {
    killAllBots(session)
    while (session.phase === 'playing') run(STEP_MS)
    beforeNext()
    runUntilControllable()
  }
  const pilots = () => session.players.map((p) => p.pilot)
  return { ...ctx, tap, runUntilControllable, finishStage, pilots }
}

/** 第 6 行整行钢墙：托管 AI 打不到对面的 bot，关卡不会被 AI 提前打完，只测状态机 */
function walledStage(name: string): RawStageConfig {
  const wall: Record<string, string> = {}
  for (let col = 0; col < 13; col += 1) wall[`6,${col}`] = 'Tf'
  return makeStage(name, ['1*basic'], wall)
}

function freezeBots(session: GameSession) {
  session.scene!['botFreezeTicks'] = Infinity
}

describe('玩家托管', () => {
  it.each([[[P1]], [[P1, P2]]])('出生完成后 2s 没有按键就托管（%#）', (players) => {
    const { run, runUntilControllable, pilots } = autopilotSetup([walledStage('1')], players)
    runUntilControllable()
    run(1950)
    expect(pilots().every((p) => p === 'human')).toBe(true)
    run(100)
    expect(pilots().every((p) => p === 'autopilot')).toBe(true)
  })

  it.each([0, 1])('按过键的玩家改按 5s 判断，另一名玩家不受影响（P%i 按键）', (i) => {
    const { run, tap, runUntilControllable, pilots } = autopilotSetup([walledStage('1')], [P1, P2])
    runUntilControllable()
    tap(CONTROLS[i].fire)
    run(2050)
    expect(pilots()[i]).toBe('human')
    expect(pilots()[1 - i]).toBe('autopilot')
    run(2900)
    expect(pilots()[i]).toBe('human')
    run(100)
    expect(pilots()[i]).toBe('autopilot')
  })

  it('一直按住绑定键不会被托管', () => {
    const { run, runUntilControllable, pilots } = autopilotSetup([walledStage('1')])
    runUntilControllable()
    key('keydown', PLAYER1_CONTROL.left)
    run(10_000)
    expect(pilots()).toEqual(['human'])
  })

  it('托管中按键立即交还，这次按键同一个 tick 生效；之后空闲 5s 再次托管', () => {
    const { session, run, runUntilControllable, pilots } = autopilotSetup([walledStage('1')])
    runUntilControllable()
    run(2050)
    expect(pilots()).toEqual(['autopilot'])
    const tank = session.scene!.tanks.find((t) => t.side === 'player')!
    const turnTo = tank.direction === 'left' ? 'right' : 'left'

    key('keydown', PLAYER1_CONTROL[turnTo])
    run(STEP_MS)
    key('keyup', PLAYER1_CONTROL[turnTo])
    expect(pilots()).toEqual(['human'])
    expect(tank.direction).toBe(turnTo)
    run(4900)
    expect(pilots()).toEqual(['human'])
    run(200)
    expect(pilots()).toEqual(['autopilot'])
  })

  it('阵亡等待复活时暂停计时、不清零，复活不重新给 2s', () => {
    const { session, run, runUntilControllable, pilots } = autopilotSetup([walledStage('1')])
    runUntilControllable()
    run(1000)
    const scene = session.scene!
    scene['killPlayer'](scene['players'][0])
    run(STEP_MS)
    expect(scene.controllable(0)).toBe(false)
    while (!scene.controllable(0)) run(STEP_MS)
    expect(session.players[0].idleTime).toBeCloseTo(1000, -2)
    run(900)
    expect(pilots()).toEqual(['human'])
    run(200)
    expect(pilots()).toEqual(['autopilot'])
  })

  it('上一关结束时托管的玩家，下一关出生完成后直接由 AI 驾驶', () => {
    const { run, runUntilControllable, finishStage, pilots, session } = autopilotSetup([
      walledStage('1'),
      walledStage('2'),
    ])
    runUntilControllable()
    run(2050)
    finishStage()
    expect(session.stageIndex).toBe(1)
    expect(pilots()).toEqual(['autopilot'])
  })

  it.each(['statistics', 'enter'] as const)(
    '关卡切换期间（%s）按键视为交还，下一关按 2s 窗口判断',
    (phase) => {
      const { session, run, tap, runUntilControllable, finishStage, pilots } = autopilotSetup([
        walledStage('1'),
        walledStage('2'),
      ])
      runUntilControllable()
      run(2050)
      finishStage(() => {
        while (session.phase !== phase) run(STEP_MS)
        tap(PLAYER1_CONTROL.down)
        expect(pilots()).toEqual(['human'])
      })
      run(1950)
      expect(pilots()).toEqual(['human'])
      run(100)
      expect(pilots()).toEqual(['autopilot'])
    },
  )

  it('胜负确定后停止计时：打完最后一辆 bot 后停手，不会在结算前被托管', () => {
    const { session, run, tap, runUntilControllable, pilots } = autopilotSetup([walledStage('1')])
    runUntilControllable()
    tap(PLAYER1_CONTROL.fire)
    run(4000)
    killAllBots(session)
    while (session.phase === 'playing') run(STEP_MS)
    expect(session.phase).toBe('statistics')
    expect(pilots()).toEqual(['human'])
    expect(session.stageEndAutopilot).toEqual([false])
  })

  it('胜负确定那一刻取快照，结算页上交还不改快照，下一关按真人开局', () => {
    const { session, run, tap, runUntilControllable, finishStage, pilots } = autopilotSetup(
      [walledStage('1'), walledStage('2')],
      [P1, P2],
    )
    runUntilControllable()
    tap(PLAYER2_CONTROL.fire)
    run(2050)
    expect(pilots()).toEqual(['autopilot', 'human'])
    finishStage(() => {
      expect(session.phase).toBe('statistics')
      expect(session.stageEndAutopilot).toEqual([true, false])
      tap(PLAYER1_CONTROL.fire)
      expect(session.statistics!.autopilot).toEqual([true, false])
    })
    expect(session.stageEndAutopilot).toBeNull()
    expect(pilots()).toEqual(['human', 'human'])
  })

  it('老鹰被毁、全员阵亡两种结局也在胜负确定时取快照', () => {
    const eagle = autopilotSetup([walledStage('1')])
    eagle.runUntilControllable()
    eagle.run(2050)
    eagle.session.scene!.map.eagleBroken = true
    eagle.run(STEP_MS)
    expect(eagle.session.phase).toBe('gameover')
    expect(eagle.session.stageEndAutopilot).toEqual([true])

    const dead = autopilotSetup([walledStage('1')])
    dead.runUntilControllable()
    dead.run(2050)
    const scene = dead.session.scene!
    dead.session.players[0].lives = 0
    scene['killPlayer'](scene['players'][0])
    while (scene.status === 'playing') dead.run(STEP_MS)
    expect(scene.loseReason).toBe('dead')
    expect(dead.session.stageEndAutopilot).toEqual([true])
  })

  it('开关关闭时不计时、不托管，aiOnly 为 false', () => {
    const { session, run, runUntilControllable, pilots } = autopilotSetup(
      [walledStage('1')],
      [P1],
      false,
    )
    runUntilControllable()
    run(20_000)
    expect(pilots()).toEqual(['human'])
    expect(session.aiOnly).toBe(false)
  })

  it('托管的玩家没命时 AI 不借命；按开火键同一个 tick 交还并借命', () => {
    const { session, run, runUntilControllable, pilots } = autopilotSetup(
      [walledStage('1')],
      [P1, P2],
    )
    runUntilControllable()
    run(2050)
    const scene = session.scene!
    session.players[0].lives = 0
    scene['killPlayer'](scene['players'][0])
    run(1000)
    expect(scene.canBorrowLife).toEqual([true, false])
    expect(pilots()).toEqual(['autopilot', 'autopilot'])

    key('keydown', PLAYER1_CONTROL.fire)
    run(STEP_MS)
    key('keyup', PLAYER1_CONTROL.fire)
    expect(pilots()).toEqual(['human', 'autopilot'])
    expect(scene['players'][0].flicker).not.toBeNull()
  })

  it('全程没有人类输入时 aiOnly 为 true；按过一次键就为 false', () => {
    const idle = autopilotSetup([walledStage('1')])
    idle.runUntilControllable()
    idle.run(2050)
    idle.session.scene!.map.eagleBroken = true
    while (idle.session.phase !== 'ended') idle.run(STEP_MS)
    expect(idle.session.aiOnly).toBe(true)

    const touched = autopilotSetup([walledStage('1')])
    touched.tap(PLAYER1_CONTROL.up)
    touched.runUntilControllable()
    touched.run(2050)
    expect(touched.pilots()).toEqual(['autopilot'])
    expect(touched.session.aiOnly).toBe(false)
  })

  it('暂停菜单里按过又松开的键不算输入；恢复时仍按着的键算', () => {
    const { input, run, runUntilControllable, pilots } = autopilotSetup([walledStage('1')])
    runUntilControllable()
    run(2050)
    key('keydown', PLAYER1_CONTROL.fire)
    key('keyup', PLAYER1_CONTROL.fire)
    input.releaseAll()
    run(STEP_MS)
    expect(pilots()).toEqual(['autopilot'])

    key('keydown', PLAYER1_CONTROL.down)
    input.releaseAll()
    run(STEP_MS)
    key('keyup', PLAYER1_CONTROL.down)
    expect(pilots()).toEqual(['human'])
  })
})
