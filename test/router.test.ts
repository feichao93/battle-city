import { describe, expect, it } from 'vitest'
import { parseHash } from '../src/ui/router'

describe('parseHash', () => {
  it('解码关卡名，双人模式标记单独解析', () => {
    expect(parseHash('#/stage/my%20map?multi-players')).toEqual({
      screen: 'battle',
      stageName: 'my map',
      multi: true,
    })
  })

  it('非法 URL 编码原样保留，交给后面的无效关卡回退', () => {
    expect(parseHash('#/stage/%')).toEqual({ screen: 'battle', stageName: '%', multi: false })
  })
})
