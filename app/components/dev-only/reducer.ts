let reducer: any = () => 0

if (DEV) {
  const initState = {
    path: null as number[],
  }

  reducer = function testOnly(state = initState, action: Action) {
    if (action.type === 'SET_AI_TANK_PATH') {
      return Object.assign({}, state, { path: action.path })
    } else if (action.type === 'REMOVE_AI_TANK_PATH') {
      return Object.assign({}, state, { path: null })
    } else {
      return state
    }
  }
}

export default reducer
