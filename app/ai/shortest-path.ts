import { dirs } from 'ai/pos-utils'
import PosInfo from './PosInfo'

// TODO 使用A*算法
export function findPath(
  posInfoArray: PosInfo[],
  start: number,
  stopConditionOrTarget: number | ((posInfo: PosInfo) => boolean),
  calculateScore: (step: number, posInfo: PosInfo) => number = step => step,
) {
  let stopCondition: (posInfo: PosInfo) => boolean
  if (typeof stopConditionOrTarget === 'number') {
    stopCondition = (posInfo: PosInfo) => posInfo.t === stopConditionOrTarget
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

  const pre = new Array<number>(posInfoArray.length)
  const distance = new Array<number>(posInfoArray.length)
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
      const posInfo = posInfoArray[u]
      if (!posInfo.canPass) {
        continue
      }
      distance[u] = step
      if (stopCondition(posInfo)) {
        const score = calculateScore(step, posInfo)
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
