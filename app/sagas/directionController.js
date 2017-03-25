import * as R from 'ramda'
import { take, put, select } from 'redux-saga/effects'
import { DIRECTION_MAP } from 'utils/constants'
import * as selectors from 'utils/selectors'
import * as A from 'utils/actions'

export default function* directionController(playerName, getControlInfo) {
  while (true) {
    const { delta } = yield take(A.TICK)
    const speed = 48 / 1000
    const tank = yield select(selectors.playerTank, playerName)
    if (tank == null) {
      continue
    }
    // { direction: null | UP }
    const { direction } = getControlInfo()
    if (direction != null) {
      // xxx 尝试同时往多个方向移动 (例如玩家按住右键和下键, 坦克不能往下移动时, 尝试往右移动)
      if (direction !== tank.get('direction')) {
        // 坦克进行转向时, 需要对坐标进行处理
        // 如果转向UP/DOWN, 则将x坐标转换到最近的8的倍数
        // 如果转向为LEFT/RIGHT, 则将y坐标设置为最近的8的倍数
        // 这样做是为了使坦克转向之后更容易的向前行驶, 因为障碍物(brick/steel/river)的坐标也总是4或8的倍数
        // 但是有的时候简单的使用Math.round来转换坐标, 可能使得坦克卡在障碍物中
        // 所以这里转向的时候, 需要同时尝试Math.floor和Math.ceil来转换坐标
        const turned = tank.set('direction', direction) // 转向之后的player对象
        const xy = DIRECTION_MAP[direction][0] === 'x' ? 'y' : 'x' // 要进行校准的坐标字段
        const n = tank.get(xy) / 8
        const useFloor = turned.set(xy, Math.floor(n) * 8)
        const useCeil = turned.set(xy, Math.ceil(n) * 8)
        const canMoveWhenUseFloor = yield select(selectors.canTankMove, useFloor)
        const canMoveWhenUseCeil = yield select(selectors.canTankMove, useCeil)
        let movedTank
        if (!canMoveWhenUseFloor) {
          movedTank = useCeil
        } else if (!canMoveWhenUseCeil) {
          movedTank = useFloor
        } else { // use-round
          movedTank = turned.set(xy, Math.round(n) * 8)
        }
        yield put({
          type: A.MOVE,
          tankId: tank.tankId,
          tank: movedTank,
        })
      } else {
        const distance = delta * speed
        const [xy, incdec] = DIRECTION_MAP[direction]
        const movedTank = tank.update(xy, incdec === 'inc'
          ? R.add(distance)
          : R.subtract(R.__, distance))
        if (yield select(selectors.canMove, movedTank)) {
          yield put({
            type: A.MOVE,
            tankId: tank.tankId,
            tank: movedTank,
          })
          if (!tank.get('moving')) {
            yield put({ type: A.START_MOVE, tankId: tank.tankId })
          }
        }
      }
    } else {
      if (tank.get('moving')) {
        yield put({ type: A.STOP_MOVE, tankId: tank.tankId })
      }
    }
  }
}
