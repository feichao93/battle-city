import React from 'react'
import BrickWall from './components/BrickWall'
import Explosion from './components/Explosion'
import Forest from './components/Forest'
import River from './components/River'
import { StagePreviewContent } from './components/StagePreview'
import SteelWall from './components/SteelWall'
import defaultStages from './stages'

import { preload } from './hocs/Image'
import { ExplosionRecord } from './types'

preload(<BrickWall x={0} y={0} />)
preload(<BrickWall x={4} y={0} />)
preload(<SteelWall x={0} y={0} />)
preload(<Forest x={0} y={0} />)
preload(<River x={0} y={0} shape={0} />)
preload(<River x={0} y={0} shape={1} />)

const explosionShapes: ExplosionShape[] = ['s0', 's1', 's2', 'b0', 'b1']
for (const shape of explosionShapes) {
  preload(<Explosion explosion={new ExplosionRecord({ shape })} />)
}

// for (const stage of defaultStages) {
//   preload(<StagePreviewContent stage={stage} />)
// }
