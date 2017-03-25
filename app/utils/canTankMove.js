import { isInField, testCollide, iterRowsAndCols } from 'utils/common'
import { BLOCK_SIZE, TANK_SIZE, ITEM_SIZE_MAP, N_MAP } from 'utils/constants'
import * as selectors from 'utils/selectors'

function isTankCollidedWithEagle(eagle, tankTarget, threshhold) {
  const eagleBox = {
    x: eagle.get('x'),
    y: eagle.get('y'),
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }
  return testCollide(eagleBox, tankTarget, threshhold)
}

function isTankCollidedWithBricks(bricks, tankTarget, threshhold) {
  const itemSize = ITEM_SIZE_MAP.BRICK
  for (const [row, col] of iterRowsAndCols(itemSize, tankTarget)) {
    const t = row * N_MAP.BRICK + col
    if (bricks.get(t)) {
      const subject = {
        x: col * itemSize,
        y: row * itemSize,
        width: itemSize,
        height: itemSize,
      }
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false
}

function isTankCollidedWithSteels(steels, tankTarget, threshhold) {
  const itemSize = ITEM_SIZE_MAP.STEEL
  for (const [row, col] of iterRowsAndCols(itemSize, tankTarget)) {
    const t = row * N_MAP.STEEL + col
    if (steels.get(t)) {
      const subject = {
        x: col * itemSize,
        y: row * itemSize,
        width: itemSize,
        height: itemSize,
      }
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false
}

function isTankCollidedWithRivers(rivers, tankTarget, threshhold) {
  const itemSize = ITEM_SIZE_MAP.RIVER
  for (const [row, col] of iterRowsAndCols(itemSize, tankTarget)) {
    const t = row * N_MAP.RIVER + col
    if (rivers.get(t)) {
      const subject = {
        x: col * itemSize,
        y: row * itemSize,
        width: itemSize,
        height: itemSize,
      }
      // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
      if (testCollide(subject, tankTarget, threshhold)) {
        return true
      }
    }
  }
  return false
}

function isTankCollidedWithOtherTanks(tanks, tank, tankTarget, threshhold) {
  // 判断坦克与其他坦克是否相撞
  for (const otherTank of tanks.values()) {
    if (tank.tankId === otherTank.tankId) {
      continue
    }
    const subject = {
      x: otherTank.x,
      y: otherTank.y,
      width: TANK_SIZE,
      height: TANK_SIZE,
    }
    if (testCollide(subject, tankTarget, threshhold)) {
      return true
    }
  }
  return false
}

export default function canTankMove(state, tank, threshhold = -0.01) {
  // tank碰撞object
  const tankTarget = {
    x: tank.x,
    y: tank.y,
    width: TANK_SIZE,
    height: TANK_SIZE,
  }

  // 判断是否位于战场内
  if (!isInField(tankTarget)) {
    return false
  }

  // 判断是否与地形相碰撞
  const { bricks, steels, rivers, eagle } = selectors.map(state).toObject()
  if (isTankCollidedWithEagle(eagle, tankTarget, threshhold)) {
    return false
  }
  if (isTankCollidedWithBricks(bricks, tankTarget, threshhold)) {
    return false
  }
  if (isTankCollidedWithSteels(steels, tankTarget, threshhold)) {
    return false
  }
  if (isTankCollidedWithRivers(rivers, tankTarget, threshhold)) {
    return false
  }

  // 判断是否与其他坦克相碰撞
  if (isTankCollidedWithOtherTanks(selectors.tanks(state), tank, tankTarget, threshhold)) {
    return false
  }

  // 与其他物品都没有相撞, 则表示可以进行移动
  return true
}
