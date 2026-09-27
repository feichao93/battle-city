import type { FrameMessage } from './frame'

/** 与 bin/lan-relay.js 一致 */
export const LAN_PATH = '/lan'
export const LAN_INFO_PATH = '/lan/info'

export type Role = 'host' | 'guest'

export interface RoomInfo {
  id: number
  name: string
  /** 起始关卡名 */
  stage: string
  players: 1 | 2
  playing: boolean
}

export interface LanResult {
  stageName: string
  scores: number[]
  cleared: boolean
}

/** 服务端发出的消息 */
export type ServerMessage =
  /** 连上后第一条：别人能打开的大厅地址 */
  | { t: 'hello'; lanUrls: string[] }
  /** 在大厅里时，房间有变化就收到完整列表 */
  | { t: 'rooms'; rooms: RoomInfo[] }
  /** 自己所在的房间有变化 */
  | { t: 'room'; room: RoomInfo; role: Role }
  /** 客机：房主离开，房间解散 */
  | { t: 'room-closed' }
  | { t: 'error'; message: string }

/** 发给服务端处理的消息 */
export type ControlMessage =
  | { t: 'create'; name: string; stage: string }
  | { t: 'join'; roomId: number }
  | { t: 'leave' }
  /** 房主改起始关卡 */
  | { t: 'stage'; stage: string }
  /** 房主开局 / 结束，大厅列表据此显示对战中 */
  | { t: 'playing'; playing: boolean }

/** 同房间两个浏览器之间的消息，服务端原样转发 */
export type PeerMessage =
  /** 房主 → 客机：开局 */
  | { t: 'start'; stage: string }
  /** 房主 → 客机：每个逻辑帧的画面 */
  | FrameMessage
  /** 房主 → 客机：整局结束 */
  | { t: 'end'; result: LanResult }
  /** 客机 → 房主：一个逻辑帧的输入，编码见 encodeInput */
  | { t: 'i'; b: number }
  /** 客机 → 房主：请求暂停 / 恢复，由房主按 nextPausedBy 判定 */
  | { t: 'pause'; paused: boolean }
  /** 房主 → 客机：谁暂停的，null 为没暂停 */
  | { t: 'paused'; by: Role | null }

export type ClientMessage = ControlMessage | PeerMessage
