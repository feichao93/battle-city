import _ from 'lodash'
import { State, TankFireInfo } from '../types'
import { asRect, testCollide } from './common'
import {
  BLOCK_SIZE as B,
  FIELD_BLOCK_SIZE as FBZ,
  MULTI_PLAYERS_SEARCH_KEY,
  TANK_SIZE,
} from './constants'
import IndexHelper from './IndexHelper'
import values from './values'

export const isInMultiPlayersMode = (state: State) => {
  const params = new URLSearchParams(state.router.location.search)
  return params.has(MULTI_PLAYERS_SEARCH_KEY)
}

// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state: State, playerName: string) => {
  const player = state.players.get(playerName)
  const { active, activeTankId } = player
  if (!active) {
    return null
  }
  return state.tanks.get(activeTankId)
}

export function fireInfo(state: State, playerName: string): TankFireInfo {
  const tank = playerTank(state, playerName)
  const { bullets } = state
  const bulletCount = bullets.filter(b => b.tankId === tank.tankId).count()
  const canFire = bulletCount < values.bulletLimit(tank) && tank.cooldown <= 0
  return {
    bulletCount,
    canFire,
    cooldown: tank.cooldown,
  }
}

export const availableSpawnPosition = (state: State): Rect => {
  const result: Rect[] = []
  const activeTanks = state.tanks.filter(t => t.active)
  outer: for (const x of [0, 6 * B, 12 * B]) {
    const option = { x, y: 0, width: TANK_SIZE, height: TANK_SIZE }
    for (const tank of activeTanks.values()) {
      if (testCollide(option, asRect(tank))) {
        continue outer
      }
    }
    result.push(option)
  }
  // TODO 需要考虑坦克默认生成的三个地点都被占用的情况
  return _.sample(result)
}

export const validPowerUpSpawnPositions = ({
  map: { bricks, rivers, steels, eagle },
}: State): Point[] => {
  // 注意 powerUp 的显示大小为 16*16, 但是碰撞大小为中间的 8*8
  const validPositions: Point[] = []
  for (let y = 0; y < (FBZ - 1) * B; y += 0.5 * B) {
    for (let x = 0; x < (FBZ - 1) * B; x += 0.5 * B) {
      let collideCount = 0

      partLoop: for (const part of [
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
