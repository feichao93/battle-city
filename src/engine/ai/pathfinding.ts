import { dirs, type Spot } from './spots'

/**
 * 在 spot 图上做 BFS 最短路。
 * 终止条件可为目标 spot 索引，或谓词；可选 calculateScore 在多个可达终点中择优。
 * 返回从 start 到终点的 spot 索引序列，不可达返回 null。
 */
export function findPath(
  spots: Spot[],
  start: number,
  target: number | ((spot: Spot) => boolean),
  calculateScore: (step: number, spot: Spot) => number = (step) => step,
): number[] | null {
  const stop: (spot: Spot) => boolean =
    typeof target === 'number' ? (s) => s.t === target : target

  const pre = new Array<number>(spots.length).fill(-1)
  const distance = new Array<number>(spots.length).fill(Infinity)

  let end = -1
  let minScore = Infinity
  let step = 0
  let frontier = new Set<number>([start])

  while (frontier.size > 0) {
    step += 1
    const next = new Set<number>()
    for (const u of frontier) {
      const spot = spots[u]
      if (!spot.canPass) {
        continue
      }
      distance[u] = step
      if (stop(spot)) {
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
    frontier = next
  }

  if (end === -1) {
    return null
  }
  const path: number[] = []
  let cur = end
  while (true) {
    path.unshift(cur)
    if (cur === start) {
      break
    }
    cur = pre[cur]
  }
  return path
}
