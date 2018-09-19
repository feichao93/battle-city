import { multicastChannel } from 'redux-saga'
import { select } from 'redux-saga/effects'
import { Input, TankRecord } from '../types'
import { getDirectionInfo } from '../utils/common'
import * as selectors from '../utils/selectors'
import { RelativePosition } from './env-utils'
import { logAI } from './logger'
import { getCol, getRow } from './spot-utils'

export default class Bot {
  private _fire = false
  private nextDirection: Direction = null
  private forwardLength = 0
  private startPos = 0
  readonly noteChannel = multicastChannel<Note>()

  constructor(readonly tankId: TankId) {}

  turn(direction: Direction) {
    DEV.LOG_AI && logAI('turn', direction)
    this.nextDirection = direction
  }

  fire() {
    DEV.LOG_AI && logAI('fire')
    this._fire = true
  }

  *forward(forwardLength: number) {
    DEV.LOG_AI && logAI('forward', forwardLength)
    const tank = yield select(selectors.tank, this.tankId)
    DEV.ASSERT && console.assert(tank != null)
    const { xy } = getDirectionInfo(this.nextDirection || tank.direction)
    this.startPos = tank.get(xy)
    this.forwardLength = forwardLength
  }

  *moveTo(t: number) {
    const tank = yield select(selectors.tank, this.tankId)
    DEV.ASSERT && console.assert(tank != null)
    const target = {
      x: getCol(t) * 8 - 8,
      y: getRow(t) * 8 - 8,
    }
    const relativePosition = new RelativePosition(tank, target)
    const direction = relativePosition.getPrimaryDirection()

    this.turn(direction)
    yield* this.forward(relativePosition.getForwardInfo(direction).length)
  }

  readonly directionControllerCallback = (tank: TankRecord): Input => {
    if (this.nextDirection && tank.direction !== this.nextDirection) {
      const direction = this.nextDirection
      return { type: 'turn', direction }
    } else if (this.forwardLength > 0) {
      const { xy } = getDirectionInfo(tank.direction)
      const movedLength = Math.abs(tank[xy] - this.startPos)
      const maxDistance = this.forwardLength - movedLength
      if (movedLength === this.forwardLength) {
        this.forwardLength = 0
        DEV.LOG_AI && logAI('note reach')
        this.noteChannel.put({ type: 'reach' })
        return null
      } else {
        return {
          type: 'forward',
          maxDistance,
        }
      }
    }
    return null
  }

  readonly fireControllerCallback = () => {
    if (this._fire) {
      this._fire = false
      return true
    } else {
      return false
    }
  }
}
