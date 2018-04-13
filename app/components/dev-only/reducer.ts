import { Map, Record } from 'immutable'

let reducer: any = () => 0

if (DEV.TANK_PATH) {
  const DevStateRecord = Record({
    pathmap: Map<string, number[]>(),
  })
  class DevState extends DevStateRecord {}

  reducer = function testOnly(state = new DevState(), action: Action) {
    if (action.type === 'SET_AI_TANK_PATH') {
      return state.update('pathmap', pathmap => pathmap.set(action.playerName, action.path))
    } else if (action.type === 'REMOVE_AI_TANK_PATH') {
      return state.update('pathmap', pathmap => pathmap.remove(action.playerName))
    } else {
      return state
    }
  }
}

export default reducer
