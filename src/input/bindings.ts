import type { Direction } from '../engine/types'

/** 单个玩家的键位映射，值为 KeyboardEvent.code */
export interface PlayerControl {
  up: string
  down: string
  left: string
  right: string
  fire: string
}

/** P1：WASD + J */
export const PLAYER1_CONTROL: PlayerControl = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  fire: 'KeyJ',
}

/** P2：方向键 + / */
export const PLAYER2_CONTROL: PlayerControl = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  fire: 'Slash',
}

const DIR_KEYS: Array<keyof Pick<PlayerControl, Direction>> = ['up', 'down', 'left', 'right']

/** 该玩家的 4 个方向键 code 列表 */
export function directionCodes(control: PlayerControl): string[] {
  return DIR_KEYS.map((k) => control[k])
}

/** 该玩家的全部 5 个键 code */
export function controlCodes(control: PlayerControl): string[] {
  return [...directionCodes(control), control.fire]
}

/** 把 code 还原为方向，非方向键返回 null */
export function codeToDirection(code: string, control: PlayerControl): Direction | null {
  for (const dir of DIR_KEYS) {
    if (control[dir] === code) {
      return dir
    }
  }
  return null
}
