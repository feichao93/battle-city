import * as _ from 'lodash'
import { State } from 'types'
import { BLOCK_SIZE, TANK_SIZE } from './constants'
import { testCollide } from './common'

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
  outer: for (const x of [0, 6 * BLOCK_SIZE, 12 * BLOCK_SIZE]) {
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
