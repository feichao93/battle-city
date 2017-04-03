import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { BLOCK_SIZE } from 'utils/constants'
import { Tank } from 'components/tanks'
import Bullet from 'components/Bullet'
import GameoverOverlay from 'components/GameoverOverlay'
import EnemyCountIndicator from 'components/EnemyCountIndicator'
import BrickLayer from 'components/BrickLayer'
import SteelLayer from 'components/SteelLayer'
import RiverLayer from 'components/RiverLayer'
import SnowLayer from 'components/SnowLayer'
import ForestLayer from 'components/ForestLayer'
import Eagle from 'components/Eagle'
import Explosion from 'components/Explosion'
import Flicker from 'components/Flicker'
import TextLayer from 'components/TextLayer'

@connect(_.identity)
export default class Screen extends React.Component {
  static propTypes = {
    bullets: React.PropTypes.any.isRequired,
    map: React.PropTypes.any.isRequired,
    explosions: React.PropTypes.any.isRequired,
    flickers: React.PropTypes.any.isRequired,
    tanks: React.PropTypes.any.isRequired,
    game: React.PropTypes.any.isRequired,
    texts: React.PropTypes.any.isRequired,
  }

  render() {
    const { bullets, map, explosions, flickers, tanks, game, texts } = this.props
    const { remainingEnemyCount, overlay } = game.toObject()
    const { bricks, steels, rivers, snows, forests, eagle } = map.toObject()
    return (
      <g role="screen">
        <EnemyCountIndicator count={remainingEnemyCount} />
        <g role="battle-field" transform={`translate(${BLOCK_SIZE},${BLOCK_SIZE})`}>
          <rect width={13 * BLOCK_SIZE} height={13 * BLOCK_SIZE} fill="#000000" />
          <RiverLayer rivers={rivers} />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
          <SnowLayer snows={snows} />
          <Eagle
            x={eagle.get('x')}
            y={eagle.get('y')}
            broken={eagle.get('broken')}
          />
          <g role="bullet-layer">
            {bullets.map((b, i) =>
              <Bullet key={i} direction={b.direction} x={b.x} y={b.y} />
            ).toArray()}
          </g>
          <g role="tank-layer">
            {tanks.map(tank =>
              <Tank
                key={tank.tankId}
                x={tank.x}
                y={tank.y}
                direction={tank.direction}
                level={0}
                color={tank.color}
                moving={tank.moving}
              />
            ).toArray()}
          </g>
          {/* 因为坦克/子弹可以"穿过"森林, 所以<ForestLayer />需要放在tank-layer和bullet-layer的后面 */}
          <ForestLayer forests={forests} />
          <g role="explosion-layer">
            {explosions.map(exp =>
              <Explosion
                key={exp.explosionId}
                x={exp.x}
                y={exp.y}
              />
            ).toArray()}
          </g>
          <g role="flicker-layer">
            {flickers.map(flicker =>
              <Flicker
                key={flicker.flickerId}
                x={flicker.x}
                y={flicker.y}
              />
            ).toArray()}
          </g>
        </g>
        {overlay === 'gameover' ? <GameoverOverlay /> : null}
        <TextLayer texts={texts} />
      </g>
    )
  }
}

