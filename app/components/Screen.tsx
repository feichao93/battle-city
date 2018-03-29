import React from 'react'
import { SCREEN_HEIGHT, SCREEN_WIDTH, ZOOM_LEVEL } from '../utils/constants'

export interface ScreenProps {
  background?: string
  children?: React.ReactNode
  onMouseDown?: React.MouseEventHandler<SVGSVGElement>
  onMouseUp?: React.MouseEventHandler<SVGSVGElement>
  onMouseMove?: React.MouseEventHandler<SVGSVGElement>
  onMouseLeave?: React.MouseEventHandler<SVGSVGElement>
  refFn?: (svg: SVGSVGElement) => void
}

export default ({
  children,
  background = '#757575',
  onMouseDown,
  onMouseLeave,
  onMouseMove,
  onMouseUp,
  refFn,
}: ScreenProps) => (
  <svg
    ref={refFn}
    className="screen"
    style={{ background }}
    width={SCREEN_WIDTH * ZOOM_LEVEL}
    height={SCREEN_HEIGHT * ZOOM_LEVEL}
    viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onMouseMove={onMouseMove}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </svg>
)
