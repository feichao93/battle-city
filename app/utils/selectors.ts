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

export const isAllPlayerDead = (state: State) => {
  const inMultiPlayersMode = isInMultiPlayersMode(state)
  if (inMultiPlayersMode) {
    const { player1, player2 } = state
    return player1.lives === 0 && !player1.isActive() && player2.lives === 0 && !player2.isActive()
  } else {
    const { player1 } = state
    return player1.lives === 0 && !player1.isActive()
  }
}

export const player = (state: State, playerName: PlayerName) => {
  return playerName === 'player-1' ? state.player1 : state.player2
}

export const tank = (state: State, tankId: TankId) => {
  return state.tanks.get(tankId)
}

/** 根据 tankId 找到对应的 player-name */
export function playerName(state: State, tankId: TankId): PlayerName {
  if (state.player1.activeTankId === tankId) {
    return 'player-1'
  } else if (state.player2.activeTankId === tankId) {
    return 'player-2'
  } else {
    return null
  }
}

export function fireInfo(state: State, tankId: TankId): TankFireInfo {
  const tank = state.tanks.get(tankId)
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
  const aliveTanks = state.tanks.filter(t => t.alive)
  outer: for (const x of [0, 6 * B, 12 * B]) {
    const option = { x, y: 0, width: TANK_SIZE, height: TANK_SIZE }
    for (const tank of aliveTanks.values()) {
      if (testCollide(option, asRect(tank))) {
        continue outer
      }
    }
    result.push(option)
  }
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
