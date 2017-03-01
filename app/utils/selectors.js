export const player = state => state.get('player')

export const bullets = state => state.get('bullets')

export const canFire = (state, targetOwner) => !(bullets(state).has(targetOwner))
