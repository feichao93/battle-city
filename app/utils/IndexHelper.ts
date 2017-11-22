import { N_MAP, ITEM_SIZE_MAP } from 'utils/constants'

export type ItemType = 'brick' | 'steel' | 'river' | 'snow' | 'forest'

export default class IndexHelper {
  static resolveN(type: ItemType) {
    let N: number
    if (type === 'brick') {
      N = N_MAP.BRICK
    } else if (type === 'steel') {
      N = N_MAP.STEEL
    } else if (type === 'river') {
      N = N_MAP.RIVER
    } else if (type === 'snow') {
      N = N_MAP.SNOW
    } else {
      N = N_MAP.FOREST
    }
    return N
  }

  static resolveItemSize(type: ItemType) {
    if (type === 'brick') {
      return ITEM_SIZE_MAP.BRICK
    } else if (type === 'steel') {
      return ITEM_SIZE_MAP.STEEL
    } else if (type === 'river') {
      return ITEM_SIZE_MAP.RIVER
    } else if (type === 'snow') {
      return ITEM_SIZE_MAP.SNOW
    } else {
      return ITEM_SIZE_MAP.FOREST
    }
  }

  static getRowCol(type: ItemType, t: number) {
    const N = IndexHelper.resolveN(type)
    return [Math.floor(t / N), t % N]
  }

  static getPos(type: ItemType, t: number) {
    const itemSize = IndexHelper.resolveItemSize(type)
    const [row, col] = IndexHelper.getRowCol(type, t)
    return { x: col * itemSize, y: row * itemSize }
  }

  static getBox(type: ItemType, t: number): Box {
    const itemSize = IndexHelper.resolveItemSize(type)
    const [row, col] = IndexHelper.getRowCol(type, t)
    return {
      x: col * itemSize,
      y: row * itemSize,
      width: itemSize,
      height: itemSize,
    }
  }
}
