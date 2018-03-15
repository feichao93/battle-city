import { RelativePosition } from 'ai/env-utils'
import { BulletRecord, TankRecord } from 'types'
import { getTankMoveSpeed } from 'utils/common'

export function canMoveToDodge(tank: TankRecord, bullet: BulletRecord) {
  const relPos = new RelativePosition(bullet, tank) // TODO 需要考虑tank的小大以及坦克的方向
  const distance = relPos.getForwardInfo(relPos.getPrimaryDirection()).length
  const time = distance / bullet.speed
  const moveDistance = time * getTankMoveSpeed(tank)

  // TODO

  return false
}
