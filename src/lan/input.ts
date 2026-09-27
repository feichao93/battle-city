import type { Direction } from '../engine/types'
import { codeToDirection, directionCodes, type PlayerControl } from '../input/bindings'
import InputManager from '../input/InputManager'

/** 客机一个逻辑帧的输入 */
export interface InputSample {
  /** 当前生效的方向（多键同按时最近按下的那个） */
  direction: Direction | null
  fireHeld: boolean
  /** 本帧内新按下过开火键；按下又松开也算，否则快速点按会丢 */
  firePressed: boolean
}

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

/** 一个字节：低 3 位方向（0 为无），第 3 位按住开火，第 4 位本帧按下开火 */
export function encodeInput(sample: InputSample): number {
  const dir = sample.direction == null ? 0 : DIRECTIONS.indexOf(sample.direction) + 1
  return dir | (sample.fireHeld ? 8 : 0) | (sample.firePressed ? 16 : 0)
}

export function decodeInput(bits: number): InputSample {
  const dir = bits & 7
  return {
    direction: dir >= 1 && dir <= 4 ? DIRECTIONS[dir - 1] : null,
    fireHeld: (bits & 8) !== 0,
    firePressed: (bits & 16) !== 0,
  }
}

/** 读客机本地键盘在这一帧的输入；调用方随后要 endTick */
export function sampleInput(input: InputManager, control: PlayerControl): InputSample {
  const code = input.lastPressed(directionCodes(control))
  return {
    direction: code == null ? null : codeToDirection(code, control),
    fireHeld: input.isDown(control.fire),
    firePressed: input.firePressed(control),
  }
}

/** 主机上 2P 的虚拟键位：真实键盘不会产生这些 code，客机的输入换成对它们的按下/松开 */
export const REMOTE_CONTROL: PlayerControl = {
  up: 'LanRemoteUp',
  down: 'LanRemoteDown',
  left: 'LanRemoteLeft',
  right: 'LanRemoteRight',
  fire: 'LanRemoteFire',
}

/**
 * 主机的输入：本地键盘照常走 DOM 事件，客机输入翻译成 REMOTE_CONTROL 的按键喂进同一个 InputManager，
 * 引擎无需区分。ticks 记录跑过的逻辑帧数，主机据此判断要不要广播新状态。
 */
export class HostInput extends InputManager {
  ticks = 0

  override endTick(): void {
    super.endTick()
    this.ticks += 1
  }

  /**
   * 按样本把虚拟键调整到一致；客机每帧都发，失焦清空后下一帧就能补回来。
   * 不要的键无条件 keyUp：恢复暂停时 releaseAll 把按着的键挂起了，只有 keyUp 能解开
   */
  applyRemote(sample: InputSample, control: PlayerControl = REMOTE_CONTROL): void {
    for (const dir of DIRECTIONS) {
      const code = control[dir]
      const want = sample.direction === dir
      if (want && !this.isDown(code)) this.keyDown(code)
      else if (!want) this.keyUp(code)
    }
    if (sample.firePressed) {
      // 先松再按，保证产生一次开火边沿
      this.keyUp(control.fire)
      this.keyDown(control.fire)
    } else if (sample.fireHeld && !this.isDown(control.fire)) {
      this.keyDown(control.fire)
    }
    if (!sample.fireHeld) this.keyUp(control.fire)
  }
}
