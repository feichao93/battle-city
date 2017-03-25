// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
export const playerTank = (state, playerName) => {
  const { active, tankId } = state.getIn(['players', playerName])
  if (!active) {
    return null
  }
  return tanks(state).get(tankId)
}

export const tanks = state => state.get('tanks')

export const time = state => state.get('time')

export const bullets = state => state.get('bullets')

/** @deprecated refactor need to test bullets count exceeds tank's limit */
export const canFire = (state, playerName) => !bullets(state).has(playerName)

export const map = state => state.get('map')
map.bricks = state => map(state).get('bricks')
map.steels = state => map(state).get('steels')
map.eagle = state => map(state).get('eagle')

export const explosions = state => state.get('explosions')

export const flickers = state => state.get('flickers')

export { default as canTankMove } from 'utils/canTankMove'
