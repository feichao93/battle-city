import { put, take } from 'redux-saga/effects'
import * as actions from '../../utils/actions'
import { A } from '../../utils/actions'

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
    const { delta }: actions.Tick = yield take(A.Tick)
    // 本次TICK中可以移动的距离
    const len = delta * speed
    const distance = len + animatedDistance < totalDistance ? len : totalDistance - animatedDistance
    yield put(actions.moveTexts(textIds, direction, distance))
    animatedDistance += distance
    if (animatedDistance >= totalDistance) {
      return
    }
  }
}
