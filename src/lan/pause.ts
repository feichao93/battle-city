import type { Role } from './protocol'

/** 联机暂停：任意一方都能暂停，只有暂停的一方能恢复；已暂停时对方的暂停请求也忽略 */
export function nextPausedBy(current: Role | null, who: Role, paused: boolean): Role | null {
  if (paused) return current ?? who
  return current === who ? null : current
}
