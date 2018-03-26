import React from 'react'
import ImageComponent from './ImageComponent'

export default class SteelWall extends ImageComponent<Point> {
  getConfig() {
    const { x, y } = this.props
    return {
      key: `StellWall`,
      transform: `translate(${x}, ${y})`,
      width: 8,
      height: 8,
    }
  }

  renderImageContent() {
    return (
      <g className="steelwall">
        <rect width={8} height={8} fill="#ADADAD" />
        <rect x={2} y={2} width={4} height={4} fill="#FFFFFF" />
        <path d="M6,2 h1,v-1,h1,v7,h-7,v-1,h1,v-1,h4,v-4" fill="#636363" />
      </g>
    )
  }
}
