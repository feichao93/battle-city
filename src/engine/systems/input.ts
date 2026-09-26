import type InputManager from '../../input/InputManager'
import { codeToDirection, directionCodes, type PlayerControl } from '../../input/bindings'
import type Tank from '../entities/Tank'
import type { Input } from '../types'

/**
 * 把玩家键盘状态翻译成坦克级别的移动意图：
 * - 按下方向键且与当前朝向不同 → 转向
 * - 按下方向键且与当前朝向相同 → 前进
 * - 未按方向键 → null（停止）
 * 多个方向键同时按下时，最近按下的优先。
 */
export function getPlayerInput(
  input: InputManager,
  control: PlayerControl,
  tank: Tank,
): Input | null {
  const code = input.lastPressed(directionCodes(control))
  if (code == null) {
    return null
  }
  const direction = codeToDirection(code, control)
  if (direction == null) {
    return null
  }
  if (direction !== tank.direction) {
    return { type: 'turn', direction }
  }
  return { type: 'forward' }
}
