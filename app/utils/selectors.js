import { between, testCollide, testCollide2 } from 'utils/common'
import { BLOCK_SIZE, FIELD_BLOCK_SIZE, ITEM_SIZE_MAP } from 'utils/constants'

// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state, playerName) => {
  const { active, tankId } = state.getIn(['players', playerName])
  if (!active) {
    return null
  }
  return tanks(state).get(tankId)
}

export const tanks = state => state.get('tanks')

export const time = state => state.get('time')

export const bullets = state => state.get('bullets')

/** @deprecated refactor need to test bullets count exceeds tank's limit */
export const canFire = (state, playerName) => !bullets(state).has(playerName)

export const map = state => state.get('map')
map.bricks = state => map(state).get('bricks')
map.steels = state => map(state).get('steels')
map.eagle = state => map(state).get('eagle')

export const canMove = (state, tank, threshhold = -0.01) => {
  const { x, y } = tank.toObject()
  if (!between(0, x, BLOCK_SIZE * (FIELD_BLOCK_SIZE - 1))
    || !between(0, y, BLOCK_SIZE * (FIELD_BLOCK_SIZE - 1))) {
    return false
  }

  const { bricks, steels, rivers, eagle } = map(state).toObject()
  const target = {
    x,
    y,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }
  const eagleBox = {
    x: eagle.get('x'),
    y: eagle.get('y'),
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }
  if (testCollide2(eagleBox, target, -0.01)) {
    return false
  }
  if (testCollide(target, ITEM_SIZE_MAP.BRICK, bricks, threshhold)) {
    return false
  }
  if (testCollide(target, ITEM_SIZE_MAP.STEEL, steels, threshhold)) {
    return false
  }
  if (testCollide(target, ITEM_SIZE_MAP.RIVER, rivers, threshhold)) {
    return false
  }

  return true
}

export const explosions = state => state.get('explosions')

export const flickers = state => state.get('flickers')
