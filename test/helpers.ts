import {
  ACTIONS,
  INTENTS,
  type Action,
  type DecisionAnswers,
  type DecisionClient,
} from '../src/engine/ai/decision'
import { STEP_MS } from '../src/engine/Game'
import GameSession, { type PlayerConfig } from '../src/engine/GameSession'
import { PLAYER_SPAWN_POS } from '../src/engine/constants'
import { seededRandom } from '../src/engine/random'
import InputManager from '../src/input/InputManager'
import { PLAYER1_CONTROL, PLAYER2_CONTROL } from '../src/input/bindings'
import type { Direction, RawStageConfig, SoundName } from '../src/engine/types'

/** overrides 以 "row,col" 指定地形编码，其余为空地，(12, 6) 为老鹰 */
export function makeStage(
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

export const P1: PlayerConfig = {
  control: PLAYER1_CONTROL,
  color: 'yellow',
  spawnPos: PLAYER_SPAWN_POS.player1,
}
export const P2: PlayerConfig = {
  control: PLAYER2_CONTROL,
  color: 'green',
  spawnPos: PLAYER_SPAWN_POS.player2,
}

/** 决策模型的返回：action 选中项概率为 1，fire 为四个方向的 P(yes)，单个数字表示四个方向都一样 */
export function answers(
  action: Action,
  fire: number | Partial<Record<Direction, number>> = 0,
): DecisionAnswers {
  const p = (d: Direction) => ({
    type: 'noul' as const,
    noul: typeof fire === 'number' ? fire : (fire[d] ?? 0),
  })
  const one = <T extends string>(options: readonly T[], chosen: T) =>
    Object.fromEntries(options.map((o) => [o, o === chosen ? 1 : 0])) as Record<T, number>
  return {
    action: { type: 'choice', choice: action, confidence: 1, probabilities: one(ACTIONS, action) },
    fire_up: p('up'),
    fire_down: p('down'),
    fire_left: p('left'),
    fire_right: p('right'),
    intent: {
      type: 'choice',
      choice: 'attack',
      confidence: 1,
      probabilities: one(INTENTS, 'attack'),
    },
  }
}

/** 总是原地不动的决策模型；只测托管状态机时用 */
export const STAY: DecisionClient = () => Promise.resolve(answers('stay'))

export function setup(
  stages: RawStageConfig[],
  players = [P1],
  autopilot: DecisionClient | null = null,
) {
  const sounds: SoundName[] = []
  const session = new GameSession(
    stages,
    0,
    players,
    { play: (name) => sounds.push(name) },
    { autopilot, random: seededRandom(1) },
  )
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
export function runUntilPlaying(session: GameSession, run: (ms: number) => void) {
  while (session.phase !== 'playing') {
    run(STEP_MS)
  }
}

/** 推进到玩家和首个 bot 都走完出生闪烁 */
export function runUntilSpawned(session: GameSession, run: (ms: number) => void) {
  const tanks = () => session.scene!.tanks
  while (!tanks().some((t) => t.side === 'player') || !tanks().some((t) => t.side === 'bot')) {
    run(STEP_MS)
  }
}

export function killAllBots(session: GameSession) {
  for (const t of session.scene!.tanks) {
    if (t.side === 'bot') t.alive = false
  }
}
