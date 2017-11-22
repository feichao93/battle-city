import * as React from 'react'
import { BulletRecord } from 'types'
import { Pixel } from 'components/elements'
import { getMBR, lastPos } from 'utils/bullet-utils'
import { asBox } from 'utils/common'

const fill = '#ADADAD'

const Bullet = ({ bullet }: { bullet: BulletRecord }) => {
  const { x, y, direction } = bullet
  let head = null
  if (direction === 'up') {
    head = <Pixel x={1} y={-1} fill={fill} />
  } else if (direction === 'down') {
    head = <Pixel x={1} y={3} fill={fill} />
  } else if (direction === 'left') {
    head = <Pixel x={-1} y={1} fill={fill} />
  } else if (direction === 'right') { // RIGHT
    head = <Pixel x={3} y={1} fill={fill} />
  } else {
    throw new Error(`Invalid direction ${direction}`)
  }
  const last = lastPos(bullet)
  const mbr = getMBR(asBox(bullet), asBox(last))
  return (
    <g role="bullet" transform={`translate(${mbr.x},${mbr.y})`}>
      {head}
      {/* <rect width={3} height={3} fill={fill} /> */}
      <rect width={mbr.width} height={mbr.height} fill="red" />
    </g>
  )
}

export default Bullet
