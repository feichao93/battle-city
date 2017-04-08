import { State } from 'types'

// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state: State, playerName: string) => {
  const { active, tankId } = state.players.get(playerName)
  if (!active) {
    return null
  }
  return state.tanks.get(tankId, null)
}
