import { DECISION_PATH } from '../../bin/decision-proxy.js'
import type { DecisionAnswers, DecisionClient } from '../engine/ai/decision'
import { useDecisionLog } from './decisionLog'

/** 经 dev server 的 /api/decision 转发给百炼，每次请求都记进 decisionLog */
export const decisionClient: DecisionClient = async (request) => {
  const log = useDecisionLog.getState()
  const id = log.begin(request)
  const start = performance.now()
  try {
    const res = await fetch(DECISION_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state: request.prompt.text, questions: request.prompt.questions }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok || body?.answers == null) {
      throw new Error(body?.error ?? body?.message ?? `HTTP ${res.status}`)
    }
    const answers = body.answers as DecisionAnswers
    log.finish(id, {
      answers,
      rtt: Math.round(performance.now() - start),
      latency: body.latency_ms ?? null,
      requestId: body.request_id ?? null,
    })
    return answers
  } catch (e) {
    log.fail(id, e instanceof Error ? e.message : String(e), Math.round(performance.now() - start))
    throw e
  }
}
