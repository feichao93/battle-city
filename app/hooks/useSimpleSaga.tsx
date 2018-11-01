import { useEffect, useMemo } from 'react'
import { applyMiddleware, createStore } from 'redux'
import createSgaMiddleware from 'redux-saga'

export default function useSimpleSaga(sagaFn: any, reducerFn: any, preloadedState?: any): any {
  const middleware = useMemo(createSgaMiddleware, [])
  const store = useMemo(
    () => createStore(reducerFn, preloadedState, applyMiddleware(middleware)),
    [],
  )

  useEffect(() => {
    const task = middleware.run(sagaFn)
    return () => task.cancel()
  }, [])

  return store
}
