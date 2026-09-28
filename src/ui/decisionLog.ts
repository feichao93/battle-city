import { create } from 'zustand'
import type {
  DecisionAnswers,
  DecisionPrompt,
  DecisionRequest,
  DecisionState,
} from '../engine/ai/decision'

/** 最多保留这么多条，dev 下导出来离线分析用；面板只显示最近几条 */
const MAX_RECORDS = 1000

export interface DecisionRecord {
  id: number
  player: number
  /** 发请求时的本关逻辑时间（ms） */
  time: number
  state: DecisionState
  prompt: DecisionPrompt
  status: 'pending' | 'ok' | 'error'
  answers: DecisionAnswers | null
  /** 浏览器侧往返耗时（ms） */
  rtt: number | null
  /** 服务端返回的 latency_ms */
  latency: number | null
  requestId: string | null
  error: string | null
}

export interface PlayerStats {
  requests: number
  errors: number
  totalRtt: number
}

interface DecisionLogState {
  /** 新的在前 */
  records: DecisionRecord[]
  stats: Record<number, PlayerStats>
  begin: (request: DecisionRequest) => number
  finish: (
    id: number,
    result: Pick<DecisionRecord, 'answers' | 'rtt' | 'latency' | 'requestId'>,
  ) => void
  fail: (id: number, error: string, rtt: number) => void
  clear: () => void
}

let nextId = 1

function patch(records: DecisionRecord[], id: number, change: Partial<DecisionRecord>) {
  return records.map((r) => (r.id === id ? { ...r, ...change } : r))
}

function bump(stats: Record<number, PlayerStats>, player: number, change: Partial<PlayerStats>) {
  const prev = stats[player] ?? { requests: 0, errors: 0, totalRtt: 0 }
  return {
    ...stats,
    [player]: {
      requests: prev.requests + (change.requests ?? 0),
      errors: prev.errors + (change.errors ?? 0),
      totalRtt: prev.totalRtt + (change.totalRtt ?? 0),
    },
  }
}

/** 决策模型每次请求的记录，只给右侧面板看，不持久化 */
export const useDecisionLog = create<DecisionLogState>()((set, get) => ({
  records: [],
  stats: {},
  begin: (request) => {
    const id = nextId++
    const record: DecisionRecord = {
      id,
      player: request.player,
      time: request.time,
      state: request.state,
      prompt: request.prompt,
      status: 'pending',
      answers: null,
      rtt: null,
      latency: null,
      requestId: null,
      error: null,
    }
    set((s) => ({
      records: [record, ...s.records].slice(0, MAX_RECORDS),
      stats: bump(s.stats, request.player, { requests: 1 }),
    }))
    return id
  },
  finish: (id, result) => {
    const player = get().records.find((r) => r.id === id)?.player
    set((s) => ({
      records: patch(s.records, id, { ...result, status: 'ok' }),
      stats: player == null ? s.stats : bump(s.stats, player, { totalRtt: result.rtt ?? 0 }),
    }))
  },
  fail: (id, error, rtt) => {
    const player = get().records.find((r) => r.id === id)?.player
    set((s) => ({
      records: patch(s.records, id, { status: 'error', error, rtt }),
      stats: player == null ? s.stats : bump(s.stats, player, { errors: 1, totalRtt: rtt }),
    }))
  },
  clear: () => set({ records: [], stats: {} }),
}))

if (import.meta.env.DEV) {
  ;(window as unknown as { __decisionLog?: unknown }).__decisionLog = useDecisionLog
}
