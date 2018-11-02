import React, { useContext } from 'react'
import { Dispatch } from 'redux'
import { State } from './reducers'
import { Action } from './utils/actions'

const ReduxContext = React.createContext<{ state: State; dispatch: Dispatch<Action> }>(undefined)

export default ReduxContext

/** @deprecated */
export function useRedux(): [State, Dispatch] {
  const { state, dispatch } = useContext(ReduxContext)
  return [state, dispatch]
}
