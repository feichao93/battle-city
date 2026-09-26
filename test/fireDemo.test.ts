import { describe, expect, it } from 'vitest'
import { STEP_MS } from '../src/engine/Game'
import FireDemo from '../src/engine/FireDemo'

function run(demo: FireDemo, ms: number) {
  for (let t = 0; t < ms; t += STEP_MS) demo.step(STEP_MS)
}

const countTrue = (cells: boolean[]) => cells.filter(Boolean).length

describe('FireDemo', () => {
  it('玩家开火击毁 bot，爆炸播完 7 秒后 bot 重新出生；下道子弹削掉砖块', () => {
    const demo = new FireDemo()
    const bricks = () => countTrue(demo.map.bricks)
    const steels = () => countTrue(demo.map.steels)
    const bricksBefore = bricks()
    const steelsBefore = steels()
    const hasBot = () => demo.tanks.some((t) => t.side === 'bot')

    run(demo, 2500)
    expect(demo.tanks.filter((t) => t.side === 'player')).toHaveLength(2)
    expect(hasBot()).toBe(true)

    let elapsed = 0
    while (hasBot() && elapsed < 10_000) {
      run(demo, 100)
      elapsed += 100
    }
    expect(hasBot()).toBe(false)
    expect(bricks()).toBeLessThan(bricksBefore)
    expect(steels()).toBe(steelsBefore)

    // 爆炸慢放约 3 秒 + 7 秒等待 + 出生闪烁
    run(demo, 9000)
    expect(hasBot()).toBe(false)
    run(demo, 3500)
    expect(hasBot()).toBe(true)
  })

  it('暂停时世界不推进', () => {
    const demo = new FireDemo()
    demo.paused = true
    run(demo, 3000)
    expect(demo.time).toBe(0)
    expect(demo.tanks).toHaveLength(0)
  })
})
