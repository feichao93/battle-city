import Bullet from '../entities/Bullet'
import type Tank from '../entities/Tank'
import type { AudioPort, Point } from '../types'
import { bulletInterval, bulletLimit, bulletPower, bulletSpeed } from '../values'

/** 按坦克朝向计算子弹的初始位置（炮口处） */
export function bulletStartPosition(tank: Tank): Point {
  switch (tank.direction) {
    case 'up':
      return { x: tank.x + 6, y: tank.y }
    case 'down':
      return { x: tank.x + 6, y: tank.y + 13 }
    case 'left':
      return { x: tank.x, y: tank.y + 6 }
    case 'right':
      return { x: tank.x + 13, y: tank.y + 6 }
  }
}

/**
 * 处理一架坦克的开火：每 tick 递减 cooldown；cooldown 归零且请求开火、
 * 且在场子弹数未达上限时发射一发，重置 cooldown 为发射间隔。
 */
export function fireTank(
  tank: Tank,
  shouldFire: boolean,
  delta: number,
  bullets: Bullet[],
  audio: AudioPort,
): void {
  let nextCooldown = tank.cooldown <= 0 ? 0 : tank.cooldown - delta

  if (tank.cooldown <= 0 && shouldFire) {
    const active = bullets.filter((b) => b.tankId === tank.tankId && !b.dead).length
    if (active < bulletLimit(tank)) {
      const { x, y } = bulletStartPosition(tank)
      if (tank.side === 'player') {
        audio.play('bullet_shot')
      }
      bullets.push(
        new Bullet({
          side: tank.side,
          tankId: tank.tankId,
          direction: tank.direction,
          speed: bulletSpeed(tank),
          power: bulletPower(tank),
          x,
          y,
        }),
      )
      nextCooldown = bulletInterval(tank)
    }
  }

  tank.cooldown = nextCooldown
}
