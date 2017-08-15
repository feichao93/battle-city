import { take, put, select } from 'redux-saga/effects'
import { calculateBulletStartPosition, getNextId } from 'utils/common'
import * as selectors from 'utils/selectors'
import { State, TankRecord } from 'types'

export default function* fireController(playerName: string, shouldFire: () => boolean) {
  // cooldown用来记录player距离下一次可以发射子弹的时间. cooldown大于0的时候玩家不能发射子弹
  // 每个TICK时, cooldown都会相应减少. 坦克发射子弹的时候, cooldown重置为坦克的发射间隔
  // cooldown与坦克的bulletInterval属性相关, 和bulletLimit无关
  while (true) {
    const { delta }: Action.TickAction = yield take('TICK')
    const { bullets: allBullets, cooldowns }: State = yield select()
    const tank: TankRecord = yield select(selectors.playerTank, playerName)
    if (tank == null) {
      continue
    }
    const cooldown = cooldowns.get(tank.tankId)
    if (cooldown > 0) {
      yield put<Action>({
        type: 'SET_COOLDOWN',
        tankId: tank.tankId,
        cooldown: cooldown - delta,
      })
    } else {
      if (shouldFire()) {
        const tank: TankRecord = yield select(selectors.playerTank, playerName)
        if (tank == null) {
          continue
        }
        const bullets = allBullets.filter(bullet => (bullet.tankId === tank.tankId))
        if (bullets.count() >= tank.bulletLimit) {
          // 如果坦克发射的子弹已经到达上限, 则坦克不能继续发射子弹
          continue
        }

        const { x, y } = calculateBulletStartPosition(tank)
        yield put({
          type: 'ADD_BULLET',
          bulletId: getNextId('bullet'),
          direction: tank.direction,
          x,
          y,
          speed: tank.bulletSpeed,
          tankId: tank.tankId,
        })
        // 一旦发射子弹, 则重置cooldown计数器
        yield put<Action>({
          type: 'SET_COOLDOWN',
          tankId: tank.tankId,
          cooldown: tank.bulletInterval
        })
      }
    }
  }
}
