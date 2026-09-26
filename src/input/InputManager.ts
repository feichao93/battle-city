import { controlCodes, type PlayerControl } from './bindings'

/**
 * 键盘输入管理：跟踪当前按下的键，并记录方向键的按下顺序，
 * 以便「最近按下的方向键优先」（匹配原版手感）。
 * 开火为边沿触发：每个 tick 用 consumeFire 取一次「本 tick 内是否按下过」。
 */
export default class InputManager {
  private readonly down = new Set<string>()
  /** 当前仍按住的键，按最早→最新的顺序 */
  private order: string[] = []
  /** 自上次 consume 以来新按下的开火键（边沿） */
  private firePressedSince = new Set<string>()
  /** releaseAll 时仍按着的键：松开之前都不算按下，自动重复的 keydown 也忽略 */
  private readonly suppressed = new Set<string>()
  /** 自上个 tick 起按过的键，含自动重复和被 suppress 的键；只用来判断玩家在不在场 */
  private readonly touchedSince = new Set<string>()
  /** 需要 preventDefault 的键：实际绑定的键位（空格、Tab 等有默认行为），外加方向键和 / */
  private readonly handledCodes: Set<string>

  constructor(controls: PlayerControl[] = []) {
    this.handledCodes = new Set([...ALWAYS_HANDLED, ...controls.flatMap(controlCodes)])
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    this.keyDown(e.code)
    if (this.handledCodes.has(e.code)) {
      e.preventDefault()
    }
  }

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keyUp(e.code)
    if (this.handledCodes.has(e.code)) {
      e.preventDefault()
    }
  }

  /** 按下一个键；DOM 事件走这里，无头运行（测试、回放）时直接调用。自动重复同样调用 */
  keyDown(code: string): void {
    this.touchedSince.add(code)
    if (!this.down.has(code) && !this.suppressed.has(code)) {
      this.down.add(code)
      this.order.push(code)
      this.firePressedSince.add(code)
    }
  }

  keyUp(code: string): void {
    this.down.delete(code)
    this.suppressed.delete(code)
    this.order = this.order.filter((c) => c !== code)
  }

  /** 切到别的窗口后松开的键收不到 keyup，失焦时当作全部松开 */
  private readonly onBlur = (): void => this.clear()

  attach(target: GlobalEventHandlers = document): void {
    target.addEventListener('keydown', this.onKeyDown)
    target.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  detach(target: GlobalEventHandlers = document): void {
    target.removeEventListener('keydown', this.onKeyDown)
    target.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.clear()
  }

  /** 清空全部输入状态，包括 suppressed：不像 releaseAll 那样等 keyup，因为 keyup 可能永远不来 */
  private clear(): void {
    this.down.clear()
    this.order = []
    this.firePressedSince.clear()
    this.suppressed.clear()
    this.touchedSince.clear()
  }

  /** 把当前按着的键都视为已松开，需要重新按下才生效 */
  releaseAll(): void {
    for (const code of this.down) {
      this.suppressed.add(code)
    }
    this.down.clear()
    this.order = []
    this.firePressedSince.clear()
    this.touchedSince.clear()
  }

  isDown(code: string): boolean {
    return this.down.has(code)
  }

  /** 在 codes 中，当前仍按住且最近被按下的那个；都没按返回 null */
  lastPressed(codes: string[]): string | null {
    for (let i = this.order.length - 1; i >= 0; i -= 1) {
      if (codes.includes(this.order[i])) {
        return this.order[i]
      }
    }
    return null
  }

  /** 该玩家在本 tick 是否触发开火（持续按住 或 本 tick 内新按下） */
  consumeFire(control: PlayerControl): boolean {
    const held = this.down.has(control.fire)
    const edge = this.firePressedSince.has(control.fire)
    return held || edge
  }

  /** 该玩家的开火键是否在本 tick 内新按下（不含持续按住） */
  firePressed(control: PlayerControl): boolean {
    return this.firePressedSince.has(control.fire)
  }

  /** 自上个 tick 起该玩家有没有按过任一绑定键 */
  touched(control: PlayerControl): boolean {
    return controlCodes(control).some((code) => this.touchedSince.has(code))
  }

  /** 该玩家是否有绑定键正按着，含 releaseAll 之后还没松开的 */
  held(control: PlayerControl): boolean {
    return controlCodes(control).some((code) => this.down.has(code) || this.suppressed.has(code))
  }

  /** 在每个逻辑 tick 末尾清空边沿标记 */
  endTick(): void {
    this.firePressedSince.clear()
    this.touchedSince.clear()
  }
}

/** 不管键位怎么设都拦截：方向键会滚动页面，/ 会触发快速查找 */
const ALWAYS_HANDLED = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Slash']
