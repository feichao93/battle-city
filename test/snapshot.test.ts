import { describe, expect, it } from 'vitest'
import { STEP_MS } from '../src/engine/Game'
import { resetBulletIds } from '../src/engine/entities/Bullet'
import { resetTankIds } from '../src/engine/entities/Tank'
import { textView } from '../src/engine/textView'
import { makeStage, P1, P2, runUntilPlaying, setup, STAY } from './helpers'

/** 老鹰外墙 + 上方一道砖墙 + 左右两块钢 */
const STAGE = makeStage('snap', ['2*basic', '1*fast'], {
  '11,5': 'B5',
  '11,6': 'B3',
  '11,7': 'Ba',
  '12,5': 'B5',
  '12,7': 'Ba',
  '6,3': 'Bf',
  '6,4': 'Bf',
  '6,8': 'Tf',
  '6,9': 'Tf',
  '9,6': 'R',
  '3,1': 'S',
  '3,11': 'F',
})

/** 双人都不按键、开着托管，开战后推进 ms */
function runTo(ms: number) {
  resetTankIds()
  resetBulletIds()
  const ctx = setup([STAGE], [P1, P2], STAY)
  runUntilPlaying(ctx.session, ctx.run)
  ctx.run(ms)
  return ctx
}

describe('状态快照', () => {
  it('是纯数据：JSON 往返后不变', () => {
    const { session } = runTo(5000)
    const snapshot = session.snapshot()
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
  })

  it('同一局同一时刻的快照一致', () => {
    const a = JSON.stringify(runTo(8000).session.snapshot())
    const b = JSON.stringify(runTo(8000).session.snapshot())
    expect(a).toBe(b)
  })

  it('记录每辆坦克本 tick 的操作：托管的玩家有意图，出生闪烁中的坦克不在 tanks 里', () => {
    const { session, run } = runTo(0)
    expect(session.snapshot().scene!.slots.map((s) => s.state)).toEqual(['spawning', 'spawning'])
    while (session.players.some((p) => p.pilot === 'human')) run(STEP_MS)
    const tanks = session.snapshot().scene!.tanks.filter((t) => t.side === 'player')
    expect(tanks).toHaveLength(2)
    for (const tank of tanks) expect(tank.intent).not.toBeNull()
  })

  it('文本视图：表头是玩家状态，下面是 26×26 的战场', () => {
    expect(textView(runTo(4000).session.snapshot())).toMatchInlineSnapshot(`
      "stage snap · playing 4.0s · playing · bots waiting 1
      P1 lives 2 score 0 autopilot · (64,192) up · stop
      P2 lives 2 score 0 autopilot · (128,192) up · stop
      .......................b<.
      .......................bb.
      ..........................
      ..........................
      ..........................
      ..........................
      ..::....b<............%%..
      ..::....bb............%%..
      ..........................
      ..........................
      ..........................
      ..........................
      ......####......@@@@......
      ......####......@@@@......
      ..........................
      ..........................
      ..........................
      ..........................
      ............~~............
      ............~~............
      ..........................
      ..........................
      ..........#.##.#..........
      ..........#....#..........
      ........1^#.EE.#2^........
      ........11#.EE.#22........"
    `)
  })
})
