import { between, testCollide } from 'utils/common'
import { BLOCK_SIZE, TANK_SIZE, FIELD_BLOCK_SIZE, ITEM_SIZE_MAP, N_MAP } from 'utils/constants'
import * as selectors from 'utils/selectors'

export default function (state, tank, threshhold = -0.01) {
  const { x, y } = tank.toObject()

  // 判断坦克是否超过边界
  if (!between(0, x, BLOCK_SIZE * FIELD_BLOCK_SIZE - TANK_SIZE)
    || !between(0, y, BLOCK_SIZE * FIELD_BLOCK_SIZE - TANK_SIZE)) {
    return false
  }

  // eslint-disable-next-line no-shadow
  const { bricks, steels, rivers, eagle } = selectors.map(state).toObject()
  const tankTarget = {
    x,
    y,
    width: TANK_SIZE,
    height: TANK_SIZE,
  }
  const eagleBox = {
    x: eagle.get('x'),
    y: eagle.get('y'),
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }
  if (testCollide(eagleBox, tankTarget, threshhold)) {
    return false
  }

  // 判断坦克与brick是否相撞
  brickBlock: { // eslint-disable-line no-unused-labels
    const itemSize = ITEM_SIZE_MAP.BRICK
    const col1 = Math.floor(tank.x / itemSize)
    const col2 = Math.floor((tank.x + TANK_SIZE) / itemSize)
    const row1 = Math.floor(tank.y / itemSize)
    const row2 = Math.floor((tank.y + TANK_SIZE) / itemSize)
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * N_MAP.BRICK + col
        if (bricks.get(t)) {
          const subject = {
            x: col * itemSize,
            y: row * itemSize,
            width: itemSize,
            height: itemSize,
          }
          // 仍然要调用testCollide来判断是否相撞 (因为要考虑threshhold)
          if (testCollide(subject, tankTarget, threshhold)) {
            return false
          }
        }
      }
    }
  }

  // 判断坦克与steel是否相撞
  steelBlock: { // eslint-disable-line no-unused-labels
    const itemSize = ITEM_SIZE_MAP.STEEL
    const col1 = Math.floor(tank.x / itemSize)
    const col2 = Math.floor((tank.x + TANK_SIZE) / itemSize)
    const row1 = Math.floor(tank.y / itemSize)
    const row2 = Math.floor((tank.y + TANK_SIZE) / itemSize)
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * N_MAP.STEEL + col
        if (steels.get(t)) {
          const subject = {
            x: col * itemSize,
            y: row * itemSize,
            width: itemSize,
            height: itemSize,
          }
          // 仍然要调用testCollide来判断是否相撞 (因为要考虑threshhold)
          if (testCollide(subject, tankTarget, threshhold)) {
            return false
          }
        }
      }
    }
  }

  // 判断坦克与river是否相撞
  riverBlock: { // eslint-disable-line no-unused-labels
    const itemSize = ITEM_SIZE_MAP.RIVER
    const col1 = Math.floor(tank.x / itemSize)
    const col2 = Math.floor((tank.x + TANK_SIZE) / itemSize)
    const row1 = Math.floor(tank.y / itemSize)
    const row2 = Math.floor((tank.y + TANK_SIZE) / itemSize)
    for (let row = row1; row <= row2; row += 1) {
      for (let col = col1; col <= col2; col += 1) {
        const t = row * N_MAP.RIVER + col
        if (rivers.get(t)) {
          const subject = {
            x: col * itemSize,
            y: row * itemSize,
            width: itemSize,
            height: itemSize,
          }
          // 仍然要调用testCollide来判断是否相撞 (因为要考虑threshhold)
          if (testCollide(subject, tankTarget, threshhold)) {
            return false
          }
        }
      }
    }
  }

  // 判断坦克与其他坦克是否相撞
  tankBlock: { // eslint-disable-line no-unused-labels
    for (const otherTank of selectors.tanks(state).values()) {
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
        return false
      }
    }
  }

  // 与其他物品都没有相撞, 则表示可以进行移动
  return true
}
