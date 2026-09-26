import { useEffect, useRef } from 'react'
import type { PlayerControl } from '../input/bindings'
import { useUIStore } from './store'

/** 界面导航的统一按键语义：方向移动焦点，确认，返回 */
export type MenuKey = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back'

const ARROWS: Record<string, MenuKey> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/**
 * 方向键和两名玩家的方向键都能移动焦点，开火键或 Enter 确认，Esc 返回；
 * 两名玩家的键都认，改乱了某一方的键位也不会被困在某个页面。
 */
export function menuKeyOf(code: string, controls: PlayerControl[]): MenuKey | null {
  if (code === 'Escape') return 'back'
  if (code === 'Enter') return 'confirm'
  if (code in ARROWS) return ARROWS[code]
  for (const control of controls) {
    if (code === control.fire) return 'confirm'
    if (code === control.up) return 'up'
    if (code === control.down) return 'down'
    if (code === control.left) return 'left'
    if (code === control.right) return 'right'
  }
  return null
}

/** 订阅界面导航按键；enabled 为 false 时（如弹窗打开）不响应。监听器按调用顺序注册，先注册的先收到按键 */
export function useMenuKeys(
  onKey: (key: MenuKey, event: KeyboardEvent) => void,
  enabled = true,
): void {
  const bindings = useUIStore((s) => s.bindings)
  // 在按键发生时读取最新的回调与开关，避免每次渲染都重新注册监听器（会打乱注册顺序）
  const onKeyRef = useRef(onKey)
  const enabledRef = useRef(enabled)
  onKeyRef.current = onKey
  enabledRef.current = enabled

  useEffect(() => {
    const controls = [bindings.p1, bindings.p2]
    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return
      const key = menuKeyOf(e.code, controls)
      if (key != null) onKeyRef.current(key, e)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bindings])
}
