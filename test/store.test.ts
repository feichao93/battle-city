import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_HI_SCORE, useUIStore, type GameResult } from '../src/ui/store'

const result = (patch: Partial<GameResult>): GameResult => ({
  stageName: '1',
  scores: [30000],
  cleared: false,
  autopilot: [false],
  ...patch,
})

describe('store', () => {
  beforeEach(() => {
    localStorage.clear()
    useUIStore.setState({ hiScore: DEFAULT_HI_SCORE, lastGame: null, autopilot: true })
  })

  it('托管打出的分数也照常刷新最高分', () => {
    useUIStore.getState().finishGame(result({ autopilot: [true] }))
    const { hiScore, lastGame } = useUIStore.getState()
    expect(hiScore).toBe(30000)
    expect(lastGame).toMatchObject({ scores: [30000], newHiScore: true, autopilot: [true] })

    useUIStore.getState().finishGame(result({ scores: [100] }))
    expect(useUIStore.getState().hiScore).toBe(30000)
    expect(useUIStore.getState().lastGame!.newHiScore).toBe(false)
  })

  it('联机分数只刷新最高分', () => {
    useUIStore.getState().recordScores([500, 25000])
    expect(useUIStore.getState()).toMatchObject({ hiScore: 25000, lastGame: null })
    useUIStore.getState().recordScores([100])
    expect(useUIStore.getState().hiScore).toBe(25000)
  })

  it('托管开关默认开启并持久化', () => {
    expect(useUIStore.getState().autopilot).toBe(true)
    useUIStore.getState().setAutopilot(false)
    const saved = JSON.parse(localStorage.getItem('battle-city-ui')!)
    expect(saved.state.autopilot).toBe(false)
  })
})
