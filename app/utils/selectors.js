import { between, testCollide } from 'utils/common'
import { BLOCK_SIZE, FIELD_BSIZE, ITEM_SIZE_MAP } from 'utils/constants'

export const player = state => state.get('player')

export const bullets = state => state.get('bullets')

export const canFire = (state, targetOwner) => !(bullets(state).has(targetOwner))

export const map = state => state.get('map')
map.bricks = state => map(state).get('bricks')
map.steels = state => map(state).get('steels')

export const canMove = (state, movedPlayer) => {
  const { x, y } = movedPlayer.toObject()
  if (!between(0, x, BLOCK_SIZE * (FIELD_BSIZE - 1))
    || !between(0, y, BLOCK_SIZE * (FIELD_BSIZE - 1))) {
    return false
  }

  const { bricks, steels } = map(state).toObject()
  const target = {
    x,
    y,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }
  if (testCollide(target, ITEM_SIZE_MAP.BRICK, bricks, -0.05)) {
    return false
  }
  if (testCollide(target, ITEM_SIZE_MAP.STEEL, steels, -0.05)) {
    return false
  }

  return true
}
