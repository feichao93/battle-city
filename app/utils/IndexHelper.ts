import range from 'lodash/range'
import { ITEM_SIZE_MAP, N_MAP } from './constants'

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

  static getT(type: ItemType, row: number, col: number) {
    const N = IndexHelper.resolveN(type)
    return row * N + col
  }

  static getRowCol(type: ItemType, t: number) {
    const N = IndexHelper.resolveN(type)
    return [Math.floor(t / N), t % N]
  }

  static getPos(type: ItemType, t: number): Point {
    const itemSize = IndexHelper.resolveItemSize(type)
    const [row, col] = IndexHelper.getRowCol(type, t)
    return { x: col * itemSize, y: row * itemSize }
  }

  static getRect(type: ItemType, t: number): Rect {
    const itemSize = IndexHelper.resolveItemSize(type)
    const [row, col] = IndexHelper.getRowCol(type, t)
    return {
      x: col * itemSize,
      y: row * itemSize,
      width: itemSize,
      height: itemSize,
    }
  }

  /** 输入itemtType和rect. 返回[row, col]的迭代器.
   * [row, col]代表的元素将会与rect发生碰撞
   * 参数direction可以改变迭代的方向
   */
  static *iterRowCol(type: ItemType, rect: Rect, direction: Direction = 'down') {
    const N = IndexHelper.resolveN(type)
    const itemSize = IndexHelper.resolveItemSize(type)
    const col1 = Math.max(0, Math.floor(rect.x / itemSize))
    const col2 = Math.min(N - 1, Math.floor((rect.x + rect.width) / itemSize))
    const row1 = Math.max(0, Math.floor(rect.y / itemSize))
    const row2 = Math.min(N - 1, Math.floor((rect.y + rect.height) / itemSize))
    if (direction === 'down') {
      for (const row of range(row1, row2 + 1)) {
        for (const col of range(col1, col2 + 1)) {
          yield [row, col]
        }
      }
    } else if (direction === 'up') {
      for (const row of range(row2, row1 - 1, -1)) {
        for (const col of range(col1, col2 + 1)) {
          yield [row, col]
        }
      }
    } else if (direction === 'right') {
      for (const col of range(col1, col2 + 1)) {
        for (const row of range(row1, row2 + 1)) {
          yield [row, col]
        }
      }
    } else {
      // direction === 'left'
      for (const col of range(col2, col1 - 1, -1)) {
        for (const row of range(row1, row2 + 1)) {
          yield [row, col]
        }
      }
    }
  }

  static *iter(type: ItemType, rect: Rect, direction: Direction = 'down') {
    const N = IndexHelper.resolveN(type)
    for (const [row, col] of IndexHelper.iterRowCol(type, rect, direction)) {
      yield row * N + col
    }
  }
}
