import { put, take } from 'little-saga/compat'

export interface TextAnimation {
  direction: Direction
  distance: number
  duration: number
}

export default function* animateTexts(
  textIds: TextId[],
  { direction, distance: totalDistance, duration }: TextAnimation,
) {
  const speed = totalDistance / duration
  // 累计移动的距离
  let animatedDistance = 0
  while (true) {
    const { delta }: Action.TickAction = yield take('TICK')
    // 本次TICK中可以移动的距离
    const len = delta * speed
    const distance = len + animatedDistance < totalDistance ? len : totalDistance - animatedDistance
    yield put({
      type: 'UPDATE_TEXT_POSITION',
      textIds,
      direction,
      distance,
    })
    animatedDistance += distance
    if (animatedDistance >= totalDistance) {
      return
    }
  }
}
