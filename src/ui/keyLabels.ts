import type { PlayerControl } from '../input/bindings'

/** 像素字体只有字母、数字、少量标点和方向箭头，其余按键用英文短名 */
const KEY_LABELS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Slash: '/',
  Period: '.',
  Minus: '-',
  Comma: 'comma',
  Semicolon: 'semicolon',
  Space: 'space',
  Enter: 'enter',
  Escape: 'esc',
  ShiftLeft: 'lshift',
  ShiftRight: 'rshift',
}

/** 键码在像素界面上的显示名 */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3).toLowerCase()
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `num${code.slice(6).toLowerCase()}`
  return KEY_LABELS[code] ?? code.toLowerCase()
}

/** 上左下右四个方向键，都是单字符时连写（如 wasd、↑←↓→） */
export function directionLabel(control: PlayerControl): string {
  const labels = [control.up, control.left, control.down, control.right].map(keyLabel)
  return labels.join(labels.every((l) => l.length === 1) ? '' : ' ')
}
