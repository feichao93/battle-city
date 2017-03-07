import React from 'react'
import { connect } from 'react-redux'
import { BLOCK_SIZE } from 'utils/constants'
import { Tank } from 'components/tanks'
import Bullet from 'components/Bullet'
import * as selectors from 'utils/selectors'
import * as A from 'utils/actions'
import BrickLayer from 'components/BrickLayer'
import SteelLayer from 'components/SteelLayer'
import RiverLayer from 'components/RiverLayer'
import SnowLayer from 'components/SnowLayer'
import ForestLayer from 'components/ForestLayer'
import Eagle from 'components/Eagle'
import Explosion from 'components/Explosion'
import Flicker from 'components/Flicker'

function mapStateToProps(state) {
  return {
    player: selectors.player(state),
    bullets: selectors.bullets(state),
    map: selectors.map(state),
    explosions: selectors.explosions(state),
    flickers: selectors.flickers(state),
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
    //   active: React.PropTypes.bool.isRequired,
    // }).isRequired,
    // todo
    player: React.PropTypes.any.isRequired,
    bullets: React.PropTypes.any.isRequired,
    map: React.PropTypes.any.isRequired,
    explosions: React.PropTypes.any.isRequired,
    flickers: React.PropTypes.any.isRequired,
  }

  renderPlayerTank() {
    const { active, direction, x, y, moving } = this.props.player.toObject()
    if (active) {
      return (
        <Tank
          direction={direction}
          x={x}
          y={y}
          level={0}
          color="yellow"
          moving={moving}
        />
      )
    } else {
      return null
    }
  }

  render() {
    const { bullets, map, explosions, flickers } = this.props
    const { bricks, steels, rivers, snows, forests, eagle } = map.toObject()
    return (
      <g role="screen">
        <g role="board" transform={`translate(${BLOCK_SIZE},${BLOCK_SIZE})`}>
          <rect width={13 * BLOCK_SIZE} height={13 * BLOCK_SIZE} fill="#000000" />
          <RiverLayer rivers={rivers} />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
          <SnowLayer snows={snows} />
          <g role="bullets">
            {bullets.map((b, i) =>
              <Bullet key={i} direction={b.direction} x={b.x} y={b.y} />
            ).toArray()}
          </g>
          {this.renderPlayerTank()}
          <ForestLayer forests={forests} />
          <Eagle
            x={eagle.get('x')}
            y={eagle.get('y')}
            broken={eagle.get('broken')}
          />
          <g role="explosion-layer">
            {explosions.map(exp =>
              <Explosion
                key={exp.explosionId}
                x={exp.x}
                y={exp.y}
                delayedAction={{
                  type: A.REMOVE_EXPLOSION,
                  explosionId: exp.explosionId,
                }}
              />
            ).toArray()}
          </g>
          <g role="flicker-layer">
            {flickers.map(flicker =>
              <Flicker
                key={flicker.flickerId}
                x={flicker.x}
                y={flicker.y}
                delayedAction={{
                  type: A.REMOVE_FLICKER,
                  flickerId: flicker.flickerId,
                }}
              />
            ).toArray()}
          </g>
        </g>
      </g>
    )
  }
}

