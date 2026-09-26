import type { RawStageConfig } from '../engine/types'

// 用 Vite 的 glob 一次性聚合 35 个关卡 JSON
const modules = import.meta.glob<{ default: RawStageConfig }>('./stage-*.json', {
  eager: true,
})

/** 全部内置关卡，按 name 的数字大小排序 */
export const stages: RawStageConfig[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => Number(a.name) - Number(b.name))

export function getStageByName(name: string): RawStageConfig | undefined {
  return stages.find((s) => String(s.name) === String(name))
}
