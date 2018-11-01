import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { Action as BaseAction, Dispatch, Store } from 'redux'

export default function useProvider<S, A extends BaseAction>(
  store: Store<S, A>,
  Context: React.Context<S & { dispatch: Dispatch<A> }>,
) {
  const [state, setState] = useState<S>(store.getState)
  useEffect(() => store.subscribe(() => setState(store.getState())))

  return (children: React.ReactNode) => (
    <Provider store={store}>
      <Context.Provider value={{ ...state, dispatch: store.dispatch }}>{children}</Context.Provider>
    </Provider>
  )
}
