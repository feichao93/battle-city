import defaultStages from '../stages'
import { A, Action } from '../utils/actions'

export default function stages(state = defaultStages, action: Action) {
  if (action.type === A.SetCustomStage) {
    // 更新或是新增 stage
    const index = state.findIndex(s => s.name === action.stage.name)
    if (index === -1) {
      return state.push(action.stage)
    } else {
      return state.set(index, action.stage)
    }
  } else if (action.type === A.RemoveCustomStage) {
    return state.filterNot(s => s.custom && s.name === action.stageName)
  } else {
    return state
  }
}
