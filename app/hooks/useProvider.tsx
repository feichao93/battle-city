import React, { useEffect, useState } from 'react'
import { Action as BaseAction, Dispatch, Store } from 'redux'

export interface ConnectProps<S, A extends BaseAction> {
  store: Store<S, A>
  context: React.Context<{ state: S; dispatch: Dispatch<A> }>
  children: React.ReactNode
}

/** Connect a redux store to a React.Context, and render the children inside this <Context.Provider /> */
export function Connect<S, A extends BaseAction>({ store, context, children }: ConnectProps<S, A>) {
  const [state, setState] = useState(store.getState)
  useEffect(() => store.subscribe(() => setState(store.getState())))
  return React.createElement(
    context.Provider,
    { value: { state, dispatch: store.dispatch } },
    children,
  )
}
