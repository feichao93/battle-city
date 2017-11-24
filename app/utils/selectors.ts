import * as _ from 'lodash'
import { State } from 'types'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE as FBZ, TANK_SIZE } from 'utils/constants'
import { asRect, testCollide } from 'utils/common'
import IndexHelper from 'utils/IndexHelper'

// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state: State, playerName: string) => {
  const { active, activeTankId } = state.players.get(playerName)
  if (!active) {
    return null
  }
  return state.tanks.get(activeTankId, null)
}

export const availableSpawnPosition = ({ tanks }: State): Rect => {
  const result: Rect[] = []
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
        for (const t of IndexHelper.iter('brick', part)) {
          if (bricks.get(t)) {
            collideCount++
            continue partLoop
          }
        }
        for (const t of IndexHelper.iter('steel', part)) {
          if (steels.get(t)) {
            collideCount++
            continue partLoop
          }
        }
        for (const t of IndexHelper.iter('river', part)) {
          if (rivers.get(t)) {
            collideCount++
            continue partLoop
          }
        }
        if (testCollide(asRect(eagle), part)) {
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
