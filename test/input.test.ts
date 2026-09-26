import { describe, expect, it } from 'vitest'
import InputManager from '../src/input/InputManager'
import { PLAYER1_CONTROL, PLAYER2_CONTROL } from '../src/input/bindings'

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

  it('touched：自上个 tick 起按过该玩家的绑定键；其他玩家的键、Esc 不算；endTick 后清空', () => {
    const input = new InputManager()
    input.attach()
    key('keydown', 'Escape')
    key('keydown', PLAYER2_CONTROL.up)
    expect(input.touched(PLAYER1_CONTROL)).toBe(false)
    key('keydown', PLAYER1_CONTROL.left)
    key('keyup', PLAYER1_CONTROL.left)
    expect(input.touched(PLAYER1_CONTROL)).toBe(true)
    input.endTick()
    expect(input.touched(PLAYER1_CONTROL)).toBe(false)
    input.detach()
  })

  it('releaseAll 后仍按着的键：自动重复的 keydown 算 touched，held 为 true，但不算按下', () => {
    const input = new InputManager()
    input.attach()
    key('keydown', PLAYER1_CONTROL.up)
    input.releaseAll()
    expect(input.touched(PLAYER1_CONTROL)).toBe(false)
    expect(input.held(PLAYER1_CONTROL)).toBe(true)
    key('keydown', PLAYER1_CONTROL.up)
    expect(input.touched(PLAYER1_CONTROL)).toBe(true)
    expect(input.isDown(PLAYER1_CONTROL.up)).toBe(false)
    key('keyup', PLAYER1_CONTROL.up)
    expect(input.held(PLAYER1_CONTROL)).toBe(false)
    input.detach()
  })

  it('两名玩家绑定了同一个键：按下算两人都有输入', () => {
    const input = new InputManager()
    input.attach()
    const p2 = { ...PLAYER2_CONTROL, fire: PLAYER1_CONTROL.fire }
    key('keydown', PLAYER1_CONTROL.fire)
    expect(input.touched(PLAYER1_CONTROL)).toBe(true)
    expect(input.touched(p2)).toBe(true)
    input.detach()
  })

  it('窗口失焦时清空输入，包括 releaseAll 之后还没松开的键', () => {
    const input = new InputManager()
    input.attach()
    key('keydown', PLAYER1_CONTROL.up)
    key('keydown', PLAYER1_CONTROL.fire)
    input.releaseAll()
    key('keydown', PLAYER1_CONTROL.left)
    window.dispatchEvent(new Event('blur'))
    expect(input.held(PLAYER1_CONTROL)).toBe(false)
    expect(input.consumeFire(PLAYER1_CONTROL)).toBe(false)
    input.detach()
  })

  it('按实际键位拦截浏览器默认行为：开火改成空格后空格也拦截', () => {
    const control = { ...PLAYER1_CONTROL, fire: 'Space' }
    const input = new InputManager([control])
    input.attach()
    const press = (code: string) => {
      const event = new KeyboardEvent('keydown', { code, cancelable: true })
      document.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(press('Space')).toBe(true)
    expect(press('ArrowUp')).toBe(true)
    expect(press('KeyJ')).toBe(false)
    input.detach()
  })
})
