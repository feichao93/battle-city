import _ from 'lodash'
import MapRecord from '../types/MapRecord'
import { testCollide } from '../utils/common'
import IndexHelper from '../utils/IndexHelper'
import Spot from './Spot'

const threshold = -0.01

export default function getAllSpots(map: MapRecord): Spot[] {
  const result: Spot[] = []
  for (const row of _.range(0, 26)) {
    next: for (const col of _.range(0, 26)) {
      const x = col * 8
      const y = row * 8
      const spotIndex = row * 26 + col
      const rect: Rect = { x: x - 8, y: y - 8, width: 16, height: 16 }
      if (row === 0 || col === 0) {
        // 第一行和第一列总是和边界相撞
        result.push(new Spot(spotIndex, false))
        continue next
      }
      for (const t of IndexHelper.iter('brick', rect)) {
        if (map.bricks.get(t)) {
          const subject = IndexHelper.getRect('brick', t)
          if (testCollide(subject, rect, threshold)) {
            result.push(new Spot(spotIndex, false))
            continue next
          }
        }
      }
      for (const t of IndexHelper.iter('steel', rect)) {
        if (map.steels.get(t)) {
          const subject = IndexHelper.getRect('steel', t)
          if (testCollide(subject, rect, threshold)) {
            result.push(new Spot(spotIndex, false))
            continue next
          }
        }
      }
      for (const t of IndexHelper.iter('river', rect)) {
        if (map.rivers.get(t)) {
          const subject = IndexHelper.getRect('river', t)
          if (testCollide(subject, rect, threshold)) {
            result.push(new Spot(spotIndex, false))
            continue next
          }
        }
      }
      result.push(new Spot(spotIndex, true))
    }
  }
  return result
}
