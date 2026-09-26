import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RawStageConfig } from '../engine/types'
import { PLAYER1_CONTROL, PLAYER2_CONTROL, type PlayerControl } from '../input/bindings'
import { stages as builtinStages } from '../stages'

export type ControlAction = keyof PlayerControl

/** 一局游戏的结果，用于结束页和标题页 */
export interface GameResult {
  /** 最后游玩的关卡，结束页回到选关页时定位到这一关 */
  stageName: string
  /** 各玩家的最终分数 */
  scores: number[]
  /** 是否打完了全部关卡 */
  cleared: boolean
}

/** 结束页和标题页读取的上一局结果 */
export interface LastGame extends GameResult {
  /** 本局刷新了历史最高分 */
  newHiScore: boolean
}

/** 最高分的初始值，同原版标题页 */
export const DEFAULT_HI_SCORE = 20000

interface UIState {
  /** 上一局的结果；不持久化，刷新后与 NES 重新开机一样清零 */
  lastGame: LastGame | null
  /** 历史最高分（持久化） */
  hiScore: number
  /** 编辑器正在编辑的关卡；从关卡列表点编辑时写入，离开编辑器时回写 */
  editorContent: RawStageConfig | null
  /** 自定义关卡（持久化到 localStorage） */
  customStages: RawStageConfig[]
  /** 自定义键位（持久化） */
  bindings: { p1: PlayerControl; p2: PlayerControl }

  setBinding: (player: 'p1' | 'p2', action: ControlAction, code: string) => void
  resetBindings: () => void
  /** 记录一局的结果并更新最高分 */
  finishGame: (result: GameResult) => void

  setEditorContent: (stage: RawStageConfig | null) => void
  addCustomStage: (stage: RawStageConfig) => void
  deleteCustomStage: (name: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      lastGame: null,
      hiScore: DEFAULT_HI_SCORE,
      editorContent: null,
      customStages: [],
      bindings: { p1: { ...PLAYER1_CONTROL }, p2: { ...PLAYER2_CONTROL } },

      setBinding: (player, action, code) =>
        set((s) => ({
          bindings: { ...s.bindings, [player]: { ...s.bindings[player], [action]: code } },
        })),
      resetBindings: () =>
        set({ bindings: { p1: { ...PLAYER1_CONTROL }, p2: { ...PLAYER2_CONTROL } } }),
      finishGame: (result) =>
        set((s) => {
          const best = Math.max(...result.scores)
          return {
            lastGame: { ...result, newHiScore: best > s.hiScore },
            hiScore: Math.max(s.hiScore, best),
          }
        }),

      setEditorContent: (editorContent) => set({ editorContent }),
      // 同名关卡原位覆盖，保持列表顺序
      addCustomStage: (stage) =>
        set((s) => ({
          customStages: s.customStages.some((x) => x.name === stage.name)
            ? s.customStages.map((x) => (x.name === stage.name ? stage : x))
            : [...s.customStages, stage],
        })),
      deleteCustomStage: (name) =>
        set((s) => ({ customStages: s.customStages.filter((x) => x.name !== name) })),
    }),
    {
      name: 'battle-city-ui',
      partialize: (s) => ({
        customStages: s.customStages,
        bindings: s.bindings,
        hiScore: s.hiScore,
      }),
    },
  ),
)

/** 与原版一致：自定义关卡接在内置关卡之后，选关与连续闯关都走这个序列 */
export function allStages(customStages: RawStageConfig[]): RawStageConfig[] {
  return [...builtinStages, ...customStages]
}
