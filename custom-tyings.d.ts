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
