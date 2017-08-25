import { delay } from 'redux-saga'
import { reverseDirection } from 'utils/common'
import { calculatePriorityMap, getEnv, getRandomDirection, shouldFire } from 'ai/AI-utils.ts'
import GameAIClient from 'ai/GameAIClient'

// const logFire = (...args: any[]) => console.log('[fire]', ...args)
const logFire = (...args: any[]) => 0

const client = new GameAIClient()

function race<V, T extends { [key: string]: Promise<V> }>(map: T) {
  return Promise.race(Object.entries(map)
    .map(([key, promise]) => promise.then(value => ({ key, value }))))
    .then(({ key: resolvedKey, value }) => ({ [resolvedKey]: value }))
}

async function main() {
  await Promise.all([
    moveLoop(),
    fireLoop(),
  ])
}

main()

async function moveLoop() {
  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      await race({
        timeout: delay(1000),
        reach: client.noteReach(),
        // bulletComplete: client.noteBulletComplete(),
      })
    }

    let tank = await client.queryMyTank()
    console.assert(tank != null, 'tank is null in mvoeLoop!')
    const map = await client.queryMapInfo()
    const tanks = await client.queryTanksInfo()

    const env = getEnv(map, tanks, tank)

    const priorityMap = calculatePriorityMap(env)

    // 降低回头的优先级
    const reverse = reverseDirection(tank.direction)
    priorityMap[reverse] = Math.min(priorityMap[reverse], 1)

    const nextDirection = getRandomDirection(priorityMap)

    if (tank.direction !== nextDirection) {
      client.post({ type: 'turn', direction: nextDirection })
      tank = tank.set('direction', nextDirection)
      // 等待足够长的时间, 保证turn命令已经被处理
      await delay(100)
    }

    client.post({
      type: 'forward',
      // todo tank应该更加偏向于走到下一个 *路口*
      forwardLength: env.barrierInfo[tank.direction].length,
    })
  }
}

async function fireLoop() {
  let skipDelayAtFirstTime = true
  while (true) {
    if (skipDelayAtFirstTime) {
      skipDelayAtFirstTime = false
    } else {
      await race({
        timeout: delay(300),
        bulletComplete: client.noteBulletComplete(),
      })
    }

    let tank = await client.queryMyTank()
    console.assert(tank != null, 'tank is null in fireLoop!')
    const fireInfo = await client.queryMyFireInfo()
    if (fireInfo.canFire) {
      //   logFire('can not fire skip...')
      // } else {
      // logFire('can fire!')

      const map = await client.queryMapInfo()
      const tanks = await client.queryTanksInfo()

      const env = getEnv(map, tanks, tank)
      if (shouldFire(tank, env)) {
        logFire('fire!')
        client.post({ type: 'fire' })
        await delay(500)
      }
    }
  }
}
