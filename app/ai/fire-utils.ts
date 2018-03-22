import { MapRecord } from '../types'
import Spot from './Spot'

/** 开火估算
 * 从source开火击中target的过程中需要穿过的steel和brick的数量
 */
export interface FireEstimate {
  source: number
  target: number
  distance: number
  brickCount: number
  steelCount: number
  // 子弹需要穿过的物体的列表
  // penetration: {
  //   type: ItemType
  //   count: number
  // }[]
}

/** 根据 FireEstimate 计算 AI 坦克开火的次数 */
export function getAIFireCount(est: FireEstimate) {
  if (est.brickCount <= 3) {
    return 1
  } else if (est.brickCount <= 5) {
    return 2
  } else {
    return 3
  }
}

export function getFireResist(est: FireEstimate) {
  return est.brickCount + est.steelCount * 100
}

export function mergeEstMap(a: Map<number, FireEstimate>, b: Map<number, FireEstimate>) {
  for (const [key, value] of b.entries()) {
    if (!a.has(key) || (a.has(key) && getFireResist(a.get(key)) < getFireResist(value))) {
      a.set(key, value)
    }
  }
  return a
}

export function calculateFireEstimateMap(weakSpots: number[], allSpots: Spot[], map: MapRecord) {
  return weakSpots.map(spot => allSpots[spot].getIdealFireEstMap(map)).reduce(mergeEstMap)
}
