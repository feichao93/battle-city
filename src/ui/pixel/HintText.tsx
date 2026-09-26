import { BLOCK_SIZE as B } from '../../engine/constants'
import PixelText from './PixelText'

/** 页面底部的半尺寸灰色提示行 */
export default function HintText({
  content,
  x = 0.5 * B,
  y = 14.5 * B,
  fill = '#999',
}: {
  content: string
  x?: number
  y?: number
  fill?: string
}) {
  return (
    <g transform={`translate(${x}, ${y}) scale(0.5)`}>
      <PixelText fill={fill} content={content} />
    </g>
  )
}
