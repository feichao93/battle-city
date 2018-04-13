import getSum from 'lodash/sum'
import React from 'react'
import { connect } from 'react-redux'
import { wrapDisplayName } from 'recompose'
import { State } from '../types'

// HOC. 用来向组件注入名为 'tickIndex' 的prop
// tickIndex会随着时间变化
// 提供不同的interval可以改变tickIndex变化速度和tickIndex的范围
// 例如, intervals为 [100, 200, 300]
// 则前100毫秒中tickIndex的值为0, 接下来的200毫秒中tickIndex的值为1,
// 紧接着的300毫秒中tickIndex的值为2. 然后tickIndex又会变为0, 如此循环...
// tickIndex的值为 i 的时间长度由intervals数组下标 i 对应的数字决定
export default function registerTick(...intervals: number[]) {
  const sum = getSum(intervals)
  return function(BaseComponent: React.ComponentClass<any>) {
    type Props = { time: number }
    class Component extends React.Component<{}, {}> {
      static displayName = wrapDisplayName(BaseComponent, 'registerTick')

      startTime: number

      constructor(props: any) {
        super(props)
        this.startTime = props.time
      }

      render() {
        const { time, ...otherProps } = this.props as any
        let t = (time - this.startTime) % sum
        let tickIndex = 0
        while (intervals[tickIndex] < t) {
          t -= intervals[tickIndex]
          tickIndex += 1
        }

        return <BaseComponent tickIndex={tickIndex} {...otherProps} />
      }
    }

    const enhance: any = connect((state: State, ownProps) => ({
      ...ownProps,
      time: state.time,
    }))

    return enhance(Component)
  }
}
