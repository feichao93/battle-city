import React from 'react'
import { stageConfigs } from '../stages'
import { BLOCK_SIZE as B } from '../utils/constants'
import parseStageMap from '../utils/parseStageMap'
import BrickLayer from './BrickLayer'
import Eagle from './Eagle'
import ForestLayer from './ForestLayer'
import RiverLayer from './RiverLayer'
import SnowLayer from './SnowLayer'
import ImageComponent from './ImageComponent'
import SteelLayer from './SteelLayer'

interface StagePreviewProps {
  stageName: string
  x: number
  y: number
  scale: number
}

export default class StagePreview extends ImageComponent<StagePreviewProps> {
  getConfig() {
    const { stageName, x, y, scale } = this.props
    return {
      /* StagePreview 需要用 ImageComponent 么 */
      disabled: true,
      key: `StagePreview/${stageName}`,
      transform: `translate(${x}, ${y}) scale(${scale})`,
      width: 13 * B,
      height: 13 * B,
    }
  }

  renderImageContent() {
    const { stageName } = this.props
    if (stageConfigs[stageName] == null) {
      return (
        <g className="stage-preview empty">
          <rect width={13 * B} height={13 * B} fill="#000000" />
        </g>
      )
    }
    const map = parseStageMap(stageConfigs[stageName].map)
    const { rivers, steels, bricks, snows, eagle, forests } = map
    return (
      <g>
        <rect width={13 * B} height={13 * B} fill="#000000" />
        <RiverLayer rivers={rivers} />
        <SteelLayer steels={steels} />
        <BrickLayer bricks={bricks} />
        <SnowLayer snows={snows} />
        {eagle ? <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} /> : null}
        <ForestLayer forests={forests} />
      </g>
    )
  }
}
