import * as _ from 'lodash'
import { State } from 'types'
import { FIELD_BLOCK_SIZE as FBZ, BLOCK_SIZE as B, TANK_SIZE, N_MAP, ITEM_SIZE_MAP } from 'utils/constants'
import { testCollide, iterRowsAndCols, asBox } from 'utils/common'

// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state: State, playerName: string) => {
  const { active, activeTankId } = state.players.get(playerName)
  if (!active) {
    return null
  }
  return state.tanks.get(activeTankId, null)
}

export const availableSpawnPosition = ({ tanks }: State): Box => {
  const result: Box[] = []
  const activeTanks = tanks.filter(t => t.active)
  outer: for (const x of [0, 6 * B, 12 * B]) {
    const option = { x, y: 0, width: TANK_SIZE, height: TANK_SIZE }
    for (const tank of activeTanks.values()) {
      if (testCollide(option, { x: tank.x, y: tank.y, width: TANK_SIZE, height: TANK_SIZE })) {
        continue outer
      }
    }
    result.push(option)
  }
  return _.sample(result)
}

export const validPowerUpSpawnPositions = ({ map: { bricks, rivers, steels, eagle } }: State): Point[] => {
  // notice powerUp的显示大小为16*16, 但是碰撞大小为中间的8*8
  const validPositions: Point[] = []
  for (let y = 0; y < (FBZ - 1) * B; y += 0.5 * B) {
    for (let x = 0; x < (FBZ - 1) * B; x += 0.5 * B) {
      let collideCount = 0

      partLoop:
      for (const part of [
        { x: x + 4, y: y + 4, width: 4, height: 4 },
        { x: x + 8, y: y + 4, width: 4, height: 4 },
        { x: x + 4, y: y + 8, width: 4, height: 4 },
        { x: x + 8, y: y + 8, width: 4, height: 4 },
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
        validPositions.push({ x, y })
      }
    }
  }
  return validPositions
}
