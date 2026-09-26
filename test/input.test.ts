import { describe, expect, it } from 'vitest'
import InputManager from '../src/input/InputManager'
import { PLAYER1_CONTROL } from '../src/input/bindings'

const key = (type: 'keydown' | 'keyup', code: string) =>
  document.dispatchEvent(new KeyboardEvent(type, { code }))

describe('InputManager', () => {
  it('releaseAll 后仍按着的键在松开前不生效，自动重复的 keydown 也忽略', () => {
    const input = new InputManager()
    input.attach()
    key('keydown', PLAYER1_CONTROL.fire)
    key('keydown', PLAYER1_CONTROL.up)
    expect(input.consumeFire(PLAYER1_CONTROL)).toBe(true)

    input.releaseAll()
    expect(input.consumeFire(PLAYER1_CONTROL)).toBe(false)
    expect(input.lastPressed([PLAYER1_CONTROL.up])).toBeNull()

    key('keydown', PLAYER1_CONTROL.fire)
    expect(input.consumeFire(PLAYER1_CONTROL)).toBe(false)

    key('keyup', PLAYER1_CONTROL.fire)
    key('keydown', PLAYER1_CONTROL.fire)
    expect(input.consumeFire(PLAYER1_CONTROL)).toBe(true)
    input.detach()
  })
})
