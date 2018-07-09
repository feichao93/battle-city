import { put, select, take } from 'redux-saga/effects'
import { Input, TankRecord } from '../types'
import canTankMove from '../utils/canTankMove'
import { ceil8, floor8, getDirectionInfo, isPerpendicular, round8 } from '../utils/common'
import * as selectors from '../utils/selectors'
import values from '../utils/values'

// 坦克进行转向时, 需要对坐标进行处理
// 如果转向前的方向为 left / right, 则将 x 坐标转换到最近的 8 的倍数
// 如果转向前的方向为 up / down, 则将 y 坐标设置为最近的 8 的倍数
// 这样做是为了使坦克转向之后更容易的向前行驶, 因为障碍物(brick/steel/river)的坐标也总是4或8的倍数
// 但是有的时候简单的使用 round8 来转换坐标, 可能使得坦克卡在障碍物中
// 所以这里转向的时候, 需要同时尝试 floor8 和 ceil8 来转换坐标
function* getReservedTank(tank: TankRecord) {
  const { xy } = getDirectionInfo(tank.direction)
  const coordinate = tank[xy]
  const useFloor = tank.set(xy, floor8(coordinate))
  const useCeil = tank.set(xy, ceil8(coordinate))
  const canMoveWhenUseFloor = yield select(canTankMove, useFloor)
  const canMoveWhenUseCeil = yield select(canTankMove, useCeil)

  if (!canMoveWhenUseFloor) {
    return useCeil
  } else if (!canMoveWhenUseCeil) {
    return useFloor
  } else {
    return tank.set(xy, round8(coordinate))
  }
}

function move(tank: TankRecord): Action.Move {
  return {
    type: 'MOVE',
    tankId: tank.tankId,
    x: tank.x,
    y: tank.y,
    rx: tank.rx,
    ry: tank.ry,
    direction: tank.direction,
  }
}

export default function* directionController(
  playerName: string,
  getPlayerInput: (tank: TankRecord, delta: number) => Input,
) {
  while (true) {
    const { delta }: Action.TickAction = yield take('TICK')
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank == null || tank.frozenTimeout > 0) {
      continue
    }
    const input: Input = getPlayerInput(tank, delta)

    let nextFrozenTimeout = tank.frozenTimeout <= 0 ? 0 : tank.frozenTimeout - delta

    if (input == null) {
      if (tank.moving) {
        yield put({ type: 'STOP_MOVE', tankId: tank.tankId })
      }
    } else if (input.type === 'turn') {
      if (isPerpendicular(input.direction, tank.direction)) {
        yield put(move(tank.useReservedXY().set('direction', input.direction)))
      } else {
        yield put(move(tank.set('direction', input.direction)))
      }
    } else if (input.type === 'forward') {
      const speed = values.moveSpeed(tank)
      const distance = Math.min(delta * speed, input.maxDistance || Infinity)

      const { xy, updater } = getDirectionInfo(tank.direction)
      const movedTank = tank.update(xy, updater(distance))
      if (yield select(canTankMove, movedTank)) {
        const reservedTank: TankRecord = yield getReservedTank(movedTank)
        yield put(move(movedTank.merge({ rx: reservedTank.x, ry: reservedTank.y })))
        if (!tank.moving) {
          yield put({ type: 'START_MOVE', tankId: tank.tankId })
        }
      }
    } else {
      throw new Error(`Invalid input: ${input}`)
    }

    if (tank.frozenTimeout !== nextFrozenTimeout) {
      yield put<Action.SetFrozenTimeoutAction>({
        type: 'SET_FROZEN_TIMEOUT',
        tankId: tank.tankId,
        frozenTimeout: nextFrozenTimeout,
      })
    }
  }
}
