import { delay } from 'redux-saga'
import { put, take, select, takeLatest } from 'redux-saga/effects'
import { State, MapRecord } from 'types'
import { N_MAP, ITEM_SIZE_MAP } from 'utils/constants'
import { iterRowsAndCols, asBox } from 'utils/common'
import { destroyTanks } from 'sagas/bulletsSaga'

const log = console.log

function convertToBricks(map: MapRecord) {
  const { eagle, steels, bricks } = map
  const eagleSurroundingBox = {
    x: eagle.x - 8,
    y: eagle.y - 8,
    width: 32 - 1,
    height: 32 - 1,
  }

  const btset = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
      .map(([brow, bcol]) => brow * N_MAP.BRICK + bcol)
  )
  const eagleBTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, asBox(eagle, -0.1)))
      .map(([brow, bcol]) => brow * N_MAP.BRICK + bcol)
  )
  const ttset = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
      .map(([brow, bcol]) => {
        const trow = Math.floor(brow / 2)
        const tcol = Math.floor(bcol / 2)
        return trow * N_MAP.STEEL + tcol
      })
  )

  const steels2 = steels.map((set, t) => (ttset.has(t) ? false : set))
  const bricks2 = bricks.map((set, t) => (btset.has(t) && !eagleBTSet.has(t) ? true : set))

  return map.set('steels', steels2).set('bricks', bricks2)
}

function convertToSteels(map: MapRecord) {
  const { eagle, steels, bricks } = map
  const eagleSurroundingBox = {
    x: eagle.x - 8,
    y: eagle.y - 8,
    width: 32 - 1,
    height: 32 - 1,
  }
  const surroundingTTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.STEEL, eagleSurroundingBox))
      .map(([trow, tcol]) => trow * N_MAP.STEEL + tcol)
  )
  const eagleTTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.STEEL, asBox(eagle, -0.1)))
      .map(([trow, tcol]) => trow * N_MAP.STEEL + tcol)
  )
  const steels2 = steels.map((set, t) => (
    (surroundingTTSet.has(t) && !eagleTTSet.has(t)) ? true : set)
  )

  const surroundBTSet = new Set(
    Array.from(iterRowsAndCols(ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
      .map(([brow, bcol]) => brow * N_MAP.BRICK + bcol)
  )
  const bricks2 = bricks.map((set, t) => (surroundBTSet.has(t) ? false : set))

  return map.set('steels', steels2)
    .set('bricks', bricks2)
}

function* shovel() {
  yield put<Action>({
    type: 'UPDATE_MAP',
    map: convertToSteels((yield select()).map),
  })

  // shovel的有效时间
  yield delay(3e3)

  // 闪烁
  yield put<Action>({
    type: 'UPDATE_MAP',
    map: convertToBricks((yield select()).map),
  })
  for (let i = 0; i < 4; i++) {
    yield delay(200)
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToSteels((yield select()).map),
    })
    yield delay(200)
    yield put<Action>({
      type: 'UPDATE_MAP',
      map: convertToBricks((yield select()).map),
    })
  }
}

const isShovelPowerUp = (action: Action) => (
  action.type === 'PICK_POWER_UP'
  && action.powerUp.powerUpName === 'shovel'
)

export default function* powerUps() {
  yield takeLatest(isShovelPowerUp, shovel)

  while (true) {
    const pickUpAction: Action.PickPowerUpAction = yield take('PICK_POWER_UP')
    const { tank, player, powerUp: { powerUpName } } = pickUpAction
    if (powerUpName === 'grenade') {
      log(`${player.playerName} pick up 'power-up/grenade'. killing all enemies...`)
      const { tanks }: State = yield select()
      yield* destroyTanks(tanks.filter(t => t.side === 'ai').keySeq().toSet())
    } else if (powerUpName === 'tank') {
      log(`${player.playerName} pick up 'power-up/tank'. +1 life!`)
      yield put<Action>({ type: 'ADD_ONE_LIFE', playerName: player.playerName })
    } else if (powerUpName === 'star') {
      log(`${player.playerName} pick up 'power-up/star'. upgrading...`)
      yield put<Action>({ type: 'UPGRADE_TANK', tankId: tank.tankId })
    } else if (powerUpName === 'helmet') {
      log(`${player.playerName} pick up 'power-up/helmet'. spawing helmet...`)
      log('TODO helmet')
      // TODO
    } else if (powerUpName === 'shovel') {
      // shovel will be handled by task `takeLatest(isShovelPowerUp, shovel)`
    } else if (powerUpName === 'timer') {
      log(`${player.playerName} pick up 'power-up/timer'. freezing enemies...`)
      const { tanks }: State = yield select()

      // todo 考察一下这个SET_FROZEN_TIMEOUT和directionController中的put的action是否会有冲突
      yield* tanks.filter(t => t.side === 'ai').map(t => put({
        type: 'SET_FROZEN_TIMEOUT',
        tankId: t.tankId,
        frozenTimeout: 10e3,
      } as Action.SetFrozenTimeoutAction)).values()

      yield* tanks.filter(t => t.side === 'ai').map(t => put({
        type: 'SET_COOLDOWN',
        tankId: t.tankId,
        cooldown: 10e3,
      } as Action.SetCooldownAction)).values()
    } else {
      throw new Error(`Invalid powerUpName: ${powerUpName}`)
    }
  }
}
