import type Tank from './entities/Tank'

/**
 * 坦克数值规格（移速、弹速、弹间隔、弹数、威力）。
 * 数值沿用旧实现 app/utils/values.ts，bot 移速按 NES 原版修正。
 */

/** 移动速度（px/ms） */
export function moveSpeed(tank: Tank): number {
  if (tank.side === 'player') {
    return 0.045
  }
  return tank.level === 'fast' ? 0.06 : 0.03
}

/** 子弹速度（px/ms） */
export function bulletSpeed(tank: Tank): number {
  if (tank.side === 'player') {
    return tank.level === 'basic' ? 0.12 : 0.18
  }
  if (tank.level === 'basic') {
    return 0.12
  } else if (tank.level === 'power') {
    return 0.24
  } else {
    return 0.18
  }
}

/** 子弹威力：玩家 armor 为 3（可破钢），bot power 为 2，其余为 1 */
export function bulletPower(tank: Tank): number {
  if (tank.side === 'player' && tank.level === 'armor') {
    return 3
  } else if (tank.side === 'bot' && tank.level === 'power') {
    return 2
  } else {
    return 1
  }
}

/** 开火间隔（ms） */
export function bulletInterval(tank: Tank): number {
  return tank.level === 'basic' ? 300 : 200
}

/** 同时在场的最大子弹数：玩家 power/armor 为 2，其余为 1 */
export function bulletLimit(tank: Tank): number {
  if (tank.side === 'bot' || tank.level === 'basic' || tank.level === 'fast') {
    return 1
  } else {
    return 2
  }
}
