import type Tank from '../engine/entities/Tank'
import { frame } from '../engine/constants'
import type { TankColor } from '../engine/types'

type ColorTiming = [TankColor, number][]

/** bot 变色时间线（帧） */
const WITH_POWER_UP_COLORS: ColorTiming = [
  ['red', 8],
  ['silver', 8],
]
const ARMOR_COLORS: Record<number, ColorTiming> = {
  2: [
    ['green', 3],
    ['yellow', 1],
    ['green', 1],
    ['yellow', 1],
  ],
  3: [
    ['silver', 3],
    ['yellow', 1],
    ['silver', 1],
    ['yellow', 1],
  ],
  4: [
    ['silver', 3],
    ['green', 1],
    ['silver', 1],
    ['green', 1],
  ],
}

function pickColor(timing: ColorTiming, elapsed: number): TankColor {
  const period = timing.reduce((sum, [, n]) => sum + frame(n), 0)
  let t = elapsed % period
  for (const [color, n] of timing) {
    t -= frame(n)
    if (t < 0) {
      return color
    }
  }
  return timing[timing.length - 1][0]
}

/** 玩家颜色固定；bot 携带道具时红银交替，armor 按剩余 hp 闪烁，计时从进入战场开始 */
export function tankColor(
  tank: Pick<Tank, 'side' | 'color' | 'level' | 'hp' | 'withPowerUp' | 'bornAt'>,
  time: number,
): TankColor {
  if (tank.side === 'player') {
    return tank.color
  }
  const elapsed = time - tank.bornAt
  if (tank.withPowerUp) {
    return pickColor(WITH_POWER_UP_COLORS, elapsed)
  }
  const armor = tank.level === 'armor' ? ARMOR_COLORS[tank.hp] : undefined
  return armor != null ? pickColor(armor, elapsed) : tank.color
}
