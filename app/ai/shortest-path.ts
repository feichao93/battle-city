import Spot from './Spot'
import { dirs } from './spot-utils'

// TODO 使用A*算法
// TODO 寻找路径还需要考虑经过的位置安全与否 （是否容易被 player 玩家轻易地击中）
export function findPath(
  allSpots: Spot[],
  start: number,
  stopConditionOrTarget: number | ((spot: Spot) => boolean),
  calculateScore: (step: number, spot: Spot) => number = step => step,
) {
  let stopCondition: (spot: Spot) => boolean
  if (typeof stopConditionOrTarget === 'number') {
    stopCondition = (spot: Spot) => spot.t === stopConditionOrTarget
  } else {
    stopCondition = stopConditionOrTarget
  }

  function getPath(end: number) {
    const path: number[] = []
    while (true) {
      path.unshift(end)
      if (end === start) {
        break
      }
      end = pre[end]
    }
    return path
  }

  const pre = new Array<number>(allSpots.length)
  const distance = new Array<number>(allSpots.length)
  pre.fill(-1)
  distance.fill(Infinity)

  let end = -1
  let minScore = Infinity
  let step = 0
  let cnt = new Set<number>()
  cnt.add(start)
  while (cnt.size > 0) {
    step++
    const next = new Set<number>()
    for (const u of cnt) {
      const spot = allSpots[u]
      if (!spot.canPass) {
        continue
      }
      distance[u] = step
      if (stopCondition(spot)) {
        const score = calculateScore(step, spot)
        if (score < minScore) {
          minScore = score
          end = u
        }
      }
      for (const dir of dirs) {
        const v = dir(u)
        if (v != null && distance[v] === Infinity) {
          next.add(v)
          pre[v] = u
        }
      }
    }
    cnt = next
  }

  if (end !== -1) {
    return getPath(end)
  } else {
    return null
  }
}
