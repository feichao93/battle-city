import { describe, expect, it } from 'vitest'
import { N_MAP } from '../src/engine/constants'
import { parseBrickBits, parseStage } from '../src/engine/map/parseStage'
import { stages } from '../src/stages'

describe('parseBrickBits', () => {
  it('展开 1 位短格式到 4 个象限', () => {
    expect(parseBrickBits('1')).toBe(0xf000)
    expect(parseBrickBits('2')).toBe(0x0f00)
    expect(parseBrickBits('4')).toBe(0x00f0)
    expect(parseBrickBits('8')).toBe(0x000f)
    expect(parseBrickBits('f')).toBe(0xffff)
  })

  it('保留 4 位完整格式', () => {
    expect(parseBrickBits('ffff')).toBe(0xffff)
    expect(parseBrickBits('abcd')).toBe(0xabcd)
  })

  it('非法 hex 抛错', () => {
    expect(() => parseBrickBits('abc')).toThrow()
  })
})

describe('parseStage', () => {
  it('内置 35 个关卡', () => {
    expect(stages).toHaveLength(35)
  })

  it('所有关卡解析无异常，且老鹰唯一存在', () => {
    for (const raw of stages) {
      const parsed = parseStage(raw)
      expect(parsed.eagle, `stage ${raw.name} 应有老鹰`).not.toBeNull()
      expect(parsed.bricks).toHaveLength(N_MAP.BRICK ** 2)
      expect(parsed.steels).toHaveLength(N_MAP.STEEL ** 2)
      expect(parsed.rivers).toHaveLength(N_MAP.RIVER ** 2)
    }
  })

  it('地图出现两个老鹰时抛错', () => {
    expect(() =>
      parseStage({
        name: 'bad',
        difficulty: 1,
        map: [
          'E  E  X  X  X  X  X  X  X  X  X  X  X  ',
          ...Array.from({ length: 12 }, () => 'X  '.repeat(13)),
        ],
        bots: ['20*basic'],
      }),
    ).toThrow(/Eagle/)
  })

  it('stage-1 的 bots 为 18 basic + 2 fast，合计 20', () => {
    const s1 = stages.find((s) => String(s.name) === '1')!
    const parsed = parseStage(s1)
    const total = parsed.bots.reduce((sum, g) => sum + g.count, 0)
    expect(total).toBe(20)
    expect(parsed.bots).toContainEqual({ tankLevel: 'basic', count: 18 })
    expect(parsed.bots).toContainEqual({ tankLevel: 'fast', count: 2 })
  })

  it('每关 bots 合计为 20', () => {
    for (const raw of stages) {
      const parsed = parseStage(raw)
      const total = parsed.bots.reduce((sum, g) => sum + g.count, 0)
      expect(total, `stage ${raw.name} bots 合计`).toBe(20)
    }
  })
})
