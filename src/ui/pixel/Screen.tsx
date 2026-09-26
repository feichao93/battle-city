import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { SCREEN_HEIGHT, SCREEN_WIDTH, ZOOM_LEVEL } from '../../engine/constants'

interface ScreenProps {
  background?: string
  children?: ReactNode
  style?: CSSProperties
  onMouseDown?: MouseEventHandler<SVGSVGElement>
  onMouseUp?: MouseEventHandler<SVGSVGElement>
  onMouseMove?: MouseEventHandler<SVGSVGElement>
  onMouseLeave?: MouseEventHandler<SVGSVGElement>
}

/**
 * 像素屏幕容器：固定 256×240 逻辑尺寸、放大 ZOOM_LEVEL 倍，
 * 最近邻采样保持像素感。
 */
export default function Screen({
  children,
  background = '#757575',
  style,
  onMouseDown,
  onMouseLeave,
  onMouseMove,
  onMouseUp,
}: ScreenProps) {
  return (
    <svg
      className="screen"
      style={{ background, imageRendering: 'pixelated', display: 'block', ...style }}
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
}
