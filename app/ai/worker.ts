import { delay } from 'redux-saga'
import { reverseDirection } from 'utils/common'
import { calculatePriorityMap, getEnv, getRandomDirection, shouldFire } from 'ai/AI-utils.ts'
import GameAIClient from 'ai/GameAIClient'

const log = console.log
const table = console.table
// const log: any = () => 0
// const table: any = () => 0

const client = new GameAIClient()

function race<V, T extends { [key: string]: Promise<V> }>(map: T) {
  return Promise.race(Object.entries(map)
    .map(([key, promise]) => promise.then(value => ({ key, value }))))
    .then(({ key: resolvedKey, value }) => ({ [resolvedKey]: value }))
}

async function main() {
  // todo next-step 分解main循环, 将开火逻辑和行动逻辑分离开来
  while (true) {
    await race({
      timeout: delay(2000),
      bulletComplete: client.noteBulletComplete(),
      reach: client.noteReach(),
    })
    // debugger
    let tank = await client.queryMyTank()
    if (tank == null) {
      continue
    }
    const map = await client.queryMapInfo()
    const tanks = await client.queryTanksInfo()

    const env = getEnv(map, tanks, tank)
    const priorityMap = calculatePriorityMap(env)

    // 降低回头的优先级
    const reverse = reverseDirection(tank.direction)
    priorityMap[reverse] = Math.min(priorityMap[reverse], 1)

    const nextDirection = getRandomDirection(priorityMap)

    // log('binfo', env.barrierInfo)
    // log('pos', env.tankPosition)
    // log('priority-map', priorityMap)
    // log('next-direction', nextDirection)

    if (tank.direction !== nextDirection) {
      client.post({ type: 'turn', direction: nextDirection })
      tank = tank.set('direction', nextDirection)
      // 等待足够长的时间, 保证turn命令已经被处理
      await delay(100)
    }

    if (shouldFire(tank, env)) {
      log('command fire!')
      client.post({ type: 'fire' })
    }

    // log('forward-length:', env.barrierInfo[tank.direction].length)
    client.post({
      type: 'forward',
      // todo tank应该更加偏向于走到下一个 *路口*
      // forwardLength: Math.max(BLOCK_SIZE, env.barrierInfo[tank.direction].length),
      forwardLength: env.barrierInfo[tank.direction].length,
    })
    // $$postMessage({ type: 'fire', forwardLength: 3 * BLOCK_SIZE })
    // console.groupEnd()
  }
}

main()
