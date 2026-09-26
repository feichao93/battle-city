import { directionCodes, type PlayerControl } from './bindings'

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

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const { code } = e
    if (!this.down.has(code) && !this.suppressed.has(code)) {
      this.down.add(code)
      this.order.push(code)
      this.firePressedSince.add(code)
    }
    if (HANDLED_CODES.has(code)) {
      e.preventDefault()
    }
  }

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const { code } = e
    this.down.delete(code)
    this.suppressed.delete(code)
    this.order = this.order.filter((c) => c !== code)
    if (HANDLED_CODES.has(code)) {
      e.preventDefault()
    }
  }

  attach(target: GlobalEventHandlers = document): void {
    target.addEventListener('keydown', this.onKeyDown)
    target.addEventListener('keyup', this.onKeyUp)
  }

  detach(target: GlobalEventHandlers = document): void {
    target.removeEventListener('keydown', this.onKeyDown)
    target.removeEventListener('keyup', this.onKeyUp)
    this.down.clear()
    this.order = []
    this.firePressedSince.clear()
    this.suppressed.clear()
  }

  /** 把当前按着的键都视为已松开，需要重新按下才生效 */
  releaseAll(): void {
    for (const code of this.down) {
      this.suppressed.add(code)
    }
    this.down.clear()
    this.order = []
    this.firePressedSince.clear()
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

  /** 在每个逻辑 tick 末尾清空开火边沿标记 */
  endTick(): void {
    this.firePressedSince.clear()
  }
}

/** 需要 preventDefault 的键（方向键会滚动页面，/ 会触发快速查找） */
const HANDLED_CODES = new Set<string>([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Slash',
  ...directionCodes({ up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', fire: 'KeyJ' }),
  'KeyJ',
])
