import { take, put, select } from 'redux-saga/effects'
import { calculateBulletStartPosition, getNextId } from 'utils/common'
import * as A from 'utils/actions'
import * as selectors from 'utils/selectors'

export default function* fireController(playerName, shouldFire) {
  // countDown用来记录player距离下一次可以发射子弹的时间. countDown大于0的时候玩家不能发射子弹
  // 每个TICK时, countDown都会相应减少. 坦克发射子弹的时候, countDown重置为坦克的发射间隔
  // countDown与坦克的bulletInterval属性相关, 和bulletLimit无关
  let countDown = 0
  while (true) {
    const { delta } = yield take(A.TICK)
    if (countDown > 0) {
      countDown -= delta
    } else {
      if (shouldFire()) {
        const tank = yield select(selectors.playerTank, playerName)
        if (tank == null) {
          continue
        }
        const allBullets = yield select(selectors.bullets)
        const bullets = allBullets.filter(bullet => (bullet.tankId === tank.tankId))
        if (bullets.count() >= tank.bulletLimit) {
          // 如果坦克发射的子弹已经到达上限, 则坦克不能继续发射子弹
          continue
        }

        const { x, y } = calculateBulletStartPosition(tank)
        yield put(Object.assign({
          type: A.ADD_BULLET,
          bulletId: getNextId('bullet'),
          direction: tank.direction,
          x,
          y,
          speed: tank.bulletSpeed,
          tankId: tank.tankId,
        }))
        // 一旦发射子弹, 则重置countDown计数器
        countDown = tank.bulletInterval
      }
    }
  }
}
