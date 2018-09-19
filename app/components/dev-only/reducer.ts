import { Map, Record } from 'immutable'
import { A, Action } from '../../utils/actions'

let reducer: any = () => 0

if (DEV.TANK_PATH) {
  const DevStateRecord = Record({
    pathmap: Map<TankId, number[]>(),
  })
  class DevState extends DevStateRecord {}

  reducer = function testOnly(state = new DevState(), action: Action) {
    if (action.type === A.SetAITankPath) {
      return state.update('pathmap', pathmap => pathmap.set(action.tankId, action.path))
    } else if (action.type === A.RemoveAITankPath) {
      return state.update('pathmap', pathmap => pathmap.remove(action.tankId))
    } else {
      return state
    }
  }
}

export default reducer
