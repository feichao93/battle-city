import React from 'react'
import { connect } from 'react-redux'
import wrapDisplayname from 'recompose/wrapDisplayName'
import * as selectors from 'utils/selectors'

// HOC. 用来延迟dispatch action
// 组件将connect到store, 故每次TICK时高阶组件都会更新
// 在组件被mount指定的时间之后(由参数delay指定), 下一次did-update时将dispatch对应的action
// action通过props传入, 默认prop名称为 'delayedAction', 可以通过参数propKey来改变
// 参数delay - 延迟时间(单位:毫秒)
// 参数propKey - 需要dispatch的action所对应的prop名称
//
// 例如:
// 组件Explosion定义如下:
// @delayedDispatch(200)
// class Explosion { ... }
// 组件Explosion使用如下:
// <Explosion x={...} y={...} delayedAction={{ type: REMOVE_EXPLOSION, ... }} />
// }
// 这样可以实现<Explosion />自动销毁的功能了
export default function delayedDispatch(delay, propKey = 'delayedAction') {
  return function (BaseComponent) {
    class Component extends React.Component {
      static displayName = wrapDisplayname(BaseComponent, 'delayedDispatch')

      static propTypes = {
        dispatch: React.PropTypes.func.isRequired,
        time: React.PropTypes.number.isRequired,
      }

      constructor(props) {
        super(props)
        this.startTime = 0
        this.dispatched = false
      }

      componentDidMount() {
        this.startTime = this.props.time
      }

      componentDidUpdate() {
        const { dispatch, time } = this.props
        if (!this.dispatched && time - this.startTime > delay) {
          this.dispatched = true
          dispatch(this.props[propKey])
        }
      }

      render() {
        return (
          <BaseComponent {...this.props} />
        )
      }
    }

    const enhance = connect(state => ({
      time: selectors.time(state),
    }))

    return enhance(Component)
  }
}
