import { SVGAttributes } from 'react'

declare global {
  const DEV: Readonly<{
    LOG_AI: boolean
    ASSERT: boolean
    SPOT_GRAPH: boolean
    TANK_PATH: boolean
    RESTRICTED_AREA: boolean
    FAST: boolean
    TEST_STAGE: boolean
    HIDE_ABOUT: boolean
    INSPECTOR: boolean
    LOG: boolean
    LOG_PERF: boolean
    SKIP_CHOOSE_STAGE: boolean
  }>
  const COMPILE_VERSION: string
  const COMPILE_DATE: string
}

declare module 'react' {
  interface SVGAttributes<T> extends DOMAttributes<T> {
    href?: string
  }
}

declare module 'react' {
  // Hooks
  // ----------------------------------------------------------------------
  function useState<T>(
    initialState: T | (() => T),
  ): [T, (newState: T) => void | ((updater: (old: T) => T) => void)]
  function useEffect(create: () => void | (() => void), inputs?: ReadonlyArray<unknown>): void
  function useContext<T>(context: React.Context<T>): T
  function useReducer<S, A>(
    reducer: (state: S, action: A) => S,
    initialState: S,
  ): [S, (action: A) => void]
  function useCallback<F extends (...args: never[]) => unknown>(
    callback: F,
    inputs?: ReadonlyArray<unknown>,
  ): F
  function useMemo<T>(create: () => T, inputs?: ReadonlyArray<unknown>): T
  function useRef<T extends unknown>(initialValue?: T): { current: T }
  function useImperativeMethods<T>(
    ref: React.Ref<T>,
    createInstance: () => T,
    inputs?: ReadonlyArray<unknown>,
  ): void
  const useMutationEffect: typeof useEffect
  const useLayoutEffect: typeof useEffect

  export function memo<T>(functionComponent: T): T
}
