import * as _ from 'lodash'
import { State } from 'types'
import { FIELD_BLOCK_SIZE as FBZ, BLOCK_SIZE as B, TANK_SIZE, N_MAP, ITEM_SIZE_MAP } from 'utils/constants'
import { testCollide, iterRowsAndCols, asBox } from 'utils/common'

// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state: State, playerName: string) => {
  const { active, tankId } = state.players.get(playerName)
  if (!active) {
    return null
  }
  return state.tanks.get(tankId, null)
}

export const availableSpawnPosition = ({ tanks }: State): Box => {
  const result: Box[] = []
  outer: for (const x of [0, 6 * B, 12 * B]) {
    const option = { x, y: 0, width: TANK_SIZE, height: TANK_SIZE }
    for (const tank of tanks.values()) {
      if (testCollide(option, { x: tank.x, y: tank.y, width: TANK_SIZE, height: TANK_SIZE })) {
        continue outer
      }
    }
    result.push(option)
  }
  return _.sample(result)
}

export const validPowerUpSpawnPositions = ({ map: { bricks, rivers, steels, eagle } }: State): Point[] => {
  const partSize = 8 // part size of the power-up
  const validPositions: Point[] = []
  for (let row = 0; row < FBZ - 1; row += 0.5) {
    for (let col = 0; col < FBZ - 1; col += 0.5) {
      let collideCount = 0

      partLoop:
      for (const part of [
        { x: col * B + 0, y: row * B + 0, width: partSize, height: partSize },
        { x: col * B + 8, y: row * B + 0, width: partSize, height: partSize },
        { x: col * B + 0, y: row * B + 8, width: partSize, height: partSize },
        { x: col * B + 8, y: row * B + 8, width: partSize, height: partSize },
      ]) {
        for (const [brow, bcol] of iterRowsAndCols(ITEM_SIZE_MAP.BRICK, part)) {
          if (bricks.get(brow * N_MAP.BRICK + bcol)) {
            collideCount++
            continue partLoop
          }
        }
        for (const [trow, tcol] of iterRowsAndCols(ITEM_SIZE_MAP.STEEL, part)) {
          if (steels.get(trow * N_MAP.STEEL + tcol)) {
            collideCount++
            continue partLoop
          }
        }
        for (const [rrow, rcol] of iterRowsAndCols(ITEM_SIZE_MAP.RIVER, part)) {
          if (rivers.get(rrow * N_MAP.RIVER + rcol)) {
            collideCount++
            continue partLoop
          }
        }
        if (testCollide(asBox(eagle), part)) {
          collideCount++
          continue partLoop
        }
      }
      if (collideCount === 1 || collideCount === 2 || collideCount === 3) {
        validPositions.push({ x: col * B, y: row * B })
      }
    }
  }
  return validPositions
}
