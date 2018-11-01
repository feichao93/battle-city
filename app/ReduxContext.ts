import React, { useContext } from 'react'
import { Dispatch } from 'redux'
import { State } from './reducers'
import { Action } from './utils/actions'

const ReduxContext = React.createContext<State & { dispatch: Dispatch<Action> }>(undefined)

export default ReduxContext

export function useRedux(): [State, Dispatch] {
  const { dispatch, ...state } = useContext(ReduxContext)
  return [state, dispatch]
}
