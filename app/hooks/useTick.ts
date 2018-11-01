import { useRef } from 'react'
import { useRedux } from '../ReduxContext'
import getSum from 'lodash/sum'

export default function useTick(...intervals: number[]) {
  const [{ time }] = useRedux()
  const startTimeRef = useRef(time)
  const sum = getSum(intervals)

  let t = (time - startTimeRef.current) % sum

  let tickIndex = 0
  while (intervals[tickIndex] < t) {
    t -= intervals[tickIndex]
    tickIndex += 1
  }

  return tickIndex
}
