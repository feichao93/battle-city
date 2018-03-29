import defaultStages from 'stages'

export default function stages(state = defaultStages, action: Action) {
  // FIXME 使用自定义关卡开始游戏有 BUG
  if (action.type === 'ADD_CUSTOME_STAGE') {
    return state.push(action.stage.set('name', 'custom'))
  } else {
    return state
  }
}
