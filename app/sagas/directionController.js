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
    const speed = 48 / 1000
    if (pressed.length > 0) {
      const player = yield select(selectors.player)
      const direction = _.last(pressed)
      // todo 尝试同时往多个方向移动 (例如玩家按住右键和下键, 坦克不能往下移动时, 尝试往右移动)
      if (direction !== player.get('direction')) {
        // 坦克进行转向时, 需要对坐标进行处理
        // 如果转向UP/DOWN, 则将x坐标转换到最近的8的倍数
        // 如果转向为LEFT/RIGHT, 则将y坐标设置为最近的8的倍数
        // 这样做是为了使坦克转向之后更容易的向前行驶, 因为障碍物(brick/steel/river)的坐标也总是4或8的倍数
        // 但是有的时候简单的使用Math.round来转换坐标, 可能使得坦克卡在障碍物中
        // 所以这里转向的时候, 需要同时尝试Math.floor和Math.ceil来转换坐标
        const turned = player.set('direction', direction) // 转向之后的player对象
        const xy = DIRECTION_MAP[direction][0] === 'x' ? 'y' : 'x' // 要进行校准的坐标字段
        const n = player.get(xy) / 8
        const useFloor = turned.set(xy, Math.floor(n) * 8)
        const useCeil = turned.set(xy, Math.ceil(n) * 8)
        const canMoveWhenUseFloor = yield select(selectors.canMove, useFloor)
        const canMoveWhenUseCeil = yield select(selectors.canMove, useCeil)
        if (!canMoveWhenUseFloor) {
          yield put({ type: A.MOVE, player: useCeil })
        } else if (!canMoveWhenUseCeil) {
          yield put({ type: A.MOVE, player: useFloor })
        } else { // use-round
          const useRound = turned.set(xy, Math.round(n) * 8)
          yield put({ type: A.MOVE, player: useRound })
        }
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
