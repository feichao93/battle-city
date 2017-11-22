import { BulletRecord } from 'types';
import { DefaultMap } from 'utils/common'
import CollisionTarget from 'utils/CollisionTarget'

export function getMBR(...boxes: Box[]): Box {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const box of boxes) {
    left = Math.min(left, box.x)
    top = Math.min(top, box.y)
    right = Math.max(right, box.x + box.width)
    bottom = Math.max(bottom, box.y + box.height)
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

export function lastPos(b: BulletRecord) {
  return b.merge({ x: b.lastX, y: b.lastY })
}

export class BulletCollisionInfo extends DefaultMap<BulletId, CollisionTarget[]> {
  constructor() {
    super(() => [])
  }

  getBulletExpInfo() {
    const expBulletIdSet = new Set<BulletId>()
    const noExpBulletIdSet = new Set<BulletId>()
    for (const [bulletId, targetList] of this) {
      let explode = false
      for (const target of targetList) {
        if (target.type === 'border') {
          explode = true
        } else if (target.type === 'brick') {
          explode = true
        } else if (target.type === 'tank') {
          explode = target.shouldExplode
        } // else explode still remains to be false
        if (explode) {
          break
        }
      }
      if (explode) {
        expBulletIdSet.add(bulletId)
      } else {
        noExpBulletIdSet.add(bulletId)
      }
    }
    return { expBulletIdSet, noExpBulletIdSet }
  }
}
