import { between, testCollision } from 'utils/common'
import { BLOCK_SIZE, FIELD_BSIZE, ITEM_SIZE_MAP } from 'utils/constants'

export const player = state => state.get('player')

export const bullets = state => state.get('bullets')

export const canFire = (state, targetOwner) => !(bullets(state).has(targetOwner))

export const map = state => state.get('map')

export const canMove = (state, movedPlayer) => {
  const { x, y } = movedPlayer.toObject()
  if (!between(0, x, BLOCK_SIZE * (FIELD_BSIZE - 1))
    || !between(0, y, BLOCK_SIZE * (FIELD_BSIZE - 1))) {
    return false
  }

  const { bricks, steels } = map(state).toObject()
  if (testCollision(x, y, ITEM_SIZE_MAP.BRICK, bricks)) {
    return false
  }
  if (testCollision(x, y, ITEM_SIZE_MAP.STEEL, steels)) {
    return false
  }

  return true
}
