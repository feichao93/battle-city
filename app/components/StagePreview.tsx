import React from 'react'
import Image from '../hocs/Image'
import StageConfig from '../types/StageConfig'
import { BLOCK_SIZE as B } from '../utils/constants'
import BrickLayer from './BrickLayer'
import Eagle from './Eagle'
import ForestLayer from './ForestLayer'
import RiverLayer from './RiverLayer'
import SnowLayer from './SnowLayer'
import SteelLayer from './SteelLayer'
import Text from './Text'

interface StagePreviewProps {
  stage: StageConfig
  disableImageCache?: boolean
  x?: number
  y?: number
  scale?: number
}

export default class StagePreview extends React.PureComponent<StagePreviewProps> {
  render() {
    const { stage, x = 0, y = 0, scale = 1, disableImageCache } = this.props
    const name = stage != null ? stage.name : 'empty'
    if (stage == null) {
      return (
        <g className="stage-preview empty" transform={`translate(${x}, ${y}) scale(${scale})`}>
          <rect width={13 * B} height={13 * B} fill="#000000" />
        </g>
      )
    }
    const { rivers, steels, bricks, snows, eagle, forests } = stage.map
    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <rect width={13 * B} height={13 * B} fill="#666" />
        <g transform="scale(2)">
          <Text x={0.5 * B} y={1.5 * B} content="loading..." />
        </g>
        <Image
          disabled={disableImageCache}
          imageKey={`StagePreview/${name}`}
          width={13 * B}
          height={13 * B}
        >
          <rect width={13 * B} height={13 * B} fill="#000000" />
          <RiverLayer rivers={rivers} />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
          <SnowLayer snows={snows} />
          {eagle ? <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} /> : null}
          <ForestLayer forests={forests} />
        </Image>
      </g>
    )
  }
}
