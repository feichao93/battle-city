import type { IncomingMessage, ServerResponse } from 'node:http'

export const DECISION_PATH: string
export const DECISION_MODEL: string

export interface DecisionProxy {
  handleRequest(req: IncomingMessage, res: ServerResponse): boolean
}

export function createDecisionProxy(options: {
  apiKey: string | undefined
  workspaceId: string | undefined
}): DecisionProxy
