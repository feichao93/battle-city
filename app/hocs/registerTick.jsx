import React from 'react'
import wrapDisplayName from 'recompose/wrapDisplayName'
import { connect } from 'react-redux'
import * as _ from 'lodash'
import * as selectors from 'utils/selectors'

// HOC. 用来向组件注入名为 'tickIndex' 的prop
// tickIndex会随着时间变化
// 提供不同的interval可以改变tickIndex变化速度和tickIndex的范围
// 例如, intervals为 [100, 200, 300]
// 则前100毫秒中tickIndex的值为0, 接下来的200毫秒中tickIndex的值为1,
// 紧接着的300毫秒中tickIndex的值为2. 然后tickIndex又会变为0, 如此循环...
// tickIndex的值为 i 的时间长度由itnervals数组下标 i 对应的数字决定
export default function registerTick(...intervals) {
  const sum = _.sum(intervals)
  return function (BaseComponent) {
    class Component extends React.Component {
      static displayName = wrapDisplayName(BaseComponent, 'registerTick')

      static propTypes = {
        time: React.PropTypes.number.isRequired,
      }

      constructor(props) {
        super(props)
        this.startTime = props.time
      }

      render() {
        const { time, ...otherProps } = this.props
        let t = (time - this.startTime) % sum
        let tickIndex = 0
        while (intervals[tickIndex] < t) {
          t -= intervals[tickIndex]
          tickIndex += 1
        }
        return (
          <BaseComponent tickIndex={tickIndex} {...otherProps} />
        )
      }
    }

    const enhance = connect(state => ({
      time: selectors.time(state),
    }))

    return enhance(Component)
  }
}
