import MapRecord from '../types/MapRecord'
import IndexHelper from '../utils/IndexHelper'
import { FireEstimate } from './fire-utils'
import { dirs, getCol, getRow, left, right, up } from './spot-utils'

const e = 0.1

export default class Spot {
  constructor(readonly t: number, readonly canPass: boolean) {}

  getIdealFireEstMap(map: MapRecord): Map<number, FireEstimate> {
    const startEst: FireEstimate = {
      target: this.t,
      source: this.t,
      distance: 0,
      brickCount: 0,
      steelCount: 0,
    }
    const estMap = new Map<number, FireEstimate>()
    estMap.set(startEst.source, startEst)
    for (const dir of dirs) {
      let lastPos = this.t
      let cntPos = dir(lastPos)
      let brickCount = 0
      let steelCount = 0
      let distance = 8
      while (cntPos != null) {
        const start = { x: getCol(lastPos) * 8, y: getRow(lastPos) * 8 }
        const end = { x: getCol(cntPos) * 8, y: getRow(cntPos) * 8 }

        let r1: Rect
        let r2: Rect
        if (dir === left) {
          r1 = { x: end.x + 4 + e, y: end.y - e, width: 4 - 2 * e, height: 2 * e }
          r2 = { x: end.x + e, y: end.y - e, width: 4 - 2 * e, height: 2 * e }
        } else if (dir === right) {
          r1 = { x: start.x + e, y: start.y - e, width: 4 - 2 * e, height: 2 * e }
          r2 = { x: start.x + e + 4, y: start.y - e, width: 4 - 2 * e, height: 2 * e }
        } else if (dir === up) {
          r1 = { x: end.x - e, y: end.y + e + 4, width: 2 * e, height: 4 - 2 * e }
          r2 = { x: end.x - e, y: end.y + e, width: 2 * e, height: 4 - 2 * e }
        } else {
          r1 = { x: start.x - e, y: start.y + e, width: 2 * e, height: 4 - 2 * e }
          r2 = { x: start.x - e, y: start.y + e + 4, width: 2 * e, height: 4 - 2 * e }
        }

        const collidedWithSteel =
          Array.from(IndexHelper.iter('steel', r1)).some(steelT => map.steels.get(steelT)) ||
          Array.from(IndexHelper.iter('steel', r2)).some(steelT => map.steels.get(steelT))
        if (collidedWithSteel) {
          steelCount++
        }

        if (!collidedWithSteel) {
          // 只有在不碰到steel的情况下 才开始考虑brick
          const r1CollidedWithBrick = Array.from(IndexHelper.iter('brick', r1)).some(brickT =>
            map.bricks.get(brickT),
          )
          const r2CollidedWithBrick = Array.from(IndexHelper.iter('brick', r2)).some(brickT =>
            map.bricks.get(brickT),
          )
          if (r1CollidedWithBrick) {
            brickCount++
          }
          if (r2CollidedWithBrick) {
            brickCount++
          }
        }

        const est = { source: cntPos, distance, target: this.t, brickCount, steelCount }
        estMap.set(est.source, est)
        lastPos = cntPos
        cntPos = dir(cntPos)
        distance += 8
      }
    }
    return estMap
  }
}
