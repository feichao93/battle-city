import { BulletRecord, TankRecord } from '../types'
import values from '../utils/values'
import { RelativePosition } from './env-utils'

export function canMoveToDodge(tank: TankRecord, bullet: BulletRecord) {
  const relPos = new RelativePosition(bullet, tank) // TODO 需要考虑tank的小大以及坦克的方向
  const distance = relPos.getForwardInfo(relPos.getPrimaryDirection()).length
  const time = distance / bullet.speed
  const moveDistance = time * values.moveSpeed(tank)

  // TODO

  return false
}
