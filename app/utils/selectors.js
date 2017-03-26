// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state, playerName) => {
  const { active, tankId } = state.players.get(playerName)
  if (!active) {
    return null
  }
  return tanks(state).get(tankId)
}

export const tanks = state => state.tanks

export const time = state => state.time

export const bullets = state => state.bullets

export const map = state => state.map
map.bricks = state => map(state).get('bricks')
map.steels = state => map(state).get('steels')
map.eagle = state => map(state).get('eagle')

export const explosions = state => state.explosions

export const flickers = state => state.flickers

export const sideOfBullet = (state, bulletId) => {
  const tankId = bullets(state).get(bulletId).get('tankId')
  return tanks(state).getIn([tankId, 'side'])
}
