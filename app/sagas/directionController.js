import * as R from 'ramda'
import Mousetrap from 'mousetrap'
import { take, put, select } from 'redux-saga/effects'
import { UP, DOWN, LEFT, RIGHT, DIRECTION_MAP } from 'utils/constants'
import * as selectors from 'utils/selectors'
import * as A from 'utils/actions'
import * as _ from 'lodash'

export default function* directionController() {
  const pressed = []
  let moving = false

  bindKeyWithDirection('w', UP)
  bindKeyWithDirection('a', LEFT)
  bindKeyWithDirection('s', DOWN)
  bindKeyWithDirection('d', RIGHT)

  while (true) {
    const { delta } = yield take(A.TICK)
    const speed = 48 // 1秒16个像素
    if (pressed.length > 0) {
      const player = yield select(selectors.player)
      const direction = _.last(pressed)
      // todo 尝试同时往多个方向移动 (例如玩家按住右键和下键, 坦克不能往下移动时, 尝试往右移动)
      if (direction !== player.get('direction')) {
        yield put({ type: A.TURN, direction })
      } else {
        const distance = delta * speed
        const [xy, incdec] = DIRECTION_MAP[direction]
        const movedPlayer = player.update(xy, incdec === 'inc'
          ? R.add(distance)
          : R.subtract(R.__, distance))
        if (yield select(selectors.canMove, movedPlayer)) {
          yield put({ type: A.MOVE, player: movedPlayer })
          if (!moving) {
            yield put({ type: A.START_MOVE })
            moving = true
          }
        }
      }
    } else {
      if (moving) {
        yield put({ type: A.STOP_MOVE })
        moving = false
      }
    }
  }

  function bindKeyWithDirection(key, direction) {
    Mousetrap.bind(key, () => {
      if (!pressed.includes(direction)) {
        pressed.push(direction)
      }
    }, 'keydown')
    Mousetrap.bind(key, () => {
      _.pull(pressed, direction)
    }, 'keyup')
  }
}
