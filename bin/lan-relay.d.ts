import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Duplex } from 'node:stream'

export const LAN_PATH: string
export const LAN_INFO_PATH: string
export function lanAddresses(
  interfaces?: ReturnType<typeof import('node:os').networkInterfaces>,
): string[]
export function lanUrls(port: number, base?: string): string[]

export interface LanRelay {
  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): boolean
  handleRequest(req: IncomingMessage, res: ServerResponse): boolean
  close(): void
}

export function createLanRelay(options?: { base?: string }): LanRelay
