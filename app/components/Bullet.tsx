import * as React from 'react'
import { BulletRecord } from 'types'
import { Pixel } from 'components/elements'
import { getMBR, lastPos } from 'utils/bullet-utils'
import { asBox } from 'utils/common'

const fill = '#ADADAD'

const Bullet = ({ bullet }: { bullet: BulletRecord }) => {
  const { direction } = bullet
  let head: JSX.Element = null
  if (direction === 'up') {
    head = <Pixel x={1} y={-1} fill={fill} />
  } else if (direction === 'down') {
    head = <Pixel x={1} y={3} fill={fill} />
  } else if (direction === 'left') {
    head = <Pixel x={-1} y={1} fill={fill} />
  } else { // right
    head = <Pixel x={3} y={1} fill={fill} />
  }
  const last = lastPos(bullet)
  const mbr = getMBR(asBox(bullet), asBox(last))
  return (
    <g role="bullet" transform={`translate(${mbr.x},${mbr.y})`}>
      <rect width={3} height={3} fill={fill} />
      {head}
    </g>
  )
}

export default Bullet
