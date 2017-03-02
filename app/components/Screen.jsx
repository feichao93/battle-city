import React from 'react'
import { connect } from 'react-redux'
import { BLOCK_SIZE } from 'utils/constants'
import { Tank } from 'components/tanks'
import Bullet from 'components/Bullet'
import * as selectors from 'utils/selectors'
import BrickLayer from 'components/BrickLayer'
import SteelLayer from 'components/SteelLayer'

function mapStateToProps(state) {
  return {
    player: selectors.player(state),
    bullets: selectors.bullets(state),
    map: selectors.map(state),
  }
}

@connect(mapStateToProps)
export default class Screen extends React.Component {
  static propTypes = {
    // player: React.PropTypes.shape({
    //   x: React.PropTypes.number.isRequired,
    //   y: React.PropTypes.number.isRequired,
    //   direction: React.PropTypes.string.isRequired,
    //   moving: React.PropTypes.bool.isRequired,
    // }).isRequired,
    player: React.PropTypes.any.isRequired, // todo
    bullets: React.PropTypes.any.isRequired, // todo
    map: React.PropTypes.any.isRequired, // todo
  }

  render() {
    const { player, bullets, map } = this.props
    const { bricks, steels } = map.toObject()
    const { direction, x, y, moving } = player.toObject()
    return (
      <g role="screen">
        <g role="board" transform={`translate(${BLOCK_SIZE},${BLOCK_SIZE})`}>
          <rect width={13 * BLOCK_SIZE} height={13 * BLOCK_SIZE} fill="#000000" />
          <g role="bullets">
            {bullets.map((b, i) =>
              <Bullet key={i} direction={b.direction} x={b.x} y={b.y} />
            ).toArray()}
          </g>
          <Tank
            direction={direction}
            x={x}
            y={y}
            level={0}
            color="yellow"
            moving={moving}
          />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
        </g>
      </g>
    )
  }
}

