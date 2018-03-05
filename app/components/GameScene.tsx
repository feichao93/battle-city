import BrickLayer from 'components/BrickLayer'
import Bullet from 'components/Bullet'
import PosInfoGraph from 'components/dev-only/PosInfoGraph'
import TankPath from 'components/dev-only/TankPath'
import RestrictedAreaLayer from 'components/dev-only/RestrictedAreaLayer'
import Eagle from 'components/Eagle'
import Explosion from 'components/Explosion'
import Flicker from 'components/Flicker'
import ForestLayer from 'components/ForestLayer'
import HUD from 'components/HUD'
import PowerUp from 'components/PowerUp'
import RiverLayer from 'components/RiverLayer'
import Score from 'components/Score'
import SnowLayer from 'components/SnowLayer'
import SteelLayer from 'components/SteelLayer'
import TankHelmet from 'components/TankHelmet'
import { Tank } from 'components/tanks'
import TextLayer from 'components/TextLayer'
import * as _ from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { State } from 'types'
import { BLOCK_SIZE } from 'utils/constants'

class GameScene extends React.Component<State> {
  render() {
    const { bullets, map, explosions, flickers, tanks, texts, powerUps, scores } = this.props
    const { bricks, steels, rivers, snows, forests, eagle, restrictedAreas } = map.toObject()
    const activeTanks = tanks.filter(t => t.active)

    return (
      <g role="game-scene">
        <HUD />
        <g role="battle-field" transform={`translate(${BLOCK_SIZE},${BLOCK_SIZE})`}>
          <rect width={13 * BLOCK_SIZE} height={13 * BLOCK_SIZE} fill="#000000" />
          <RiverLayer rivers={rivers} />
          <SteelLayer steels={steels} />
          <BrickLayer bricks={bricks} />
          <SnowLayer snows={snows} />
          {eagle ? <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} /> : null}
          <g role="bullet-layer">
            {bullets.map((b, i) => <Bullet key={i} bullet={b} />).toArray()}
          </g>
          <g role="tank-layer">
            {activeTanks.map(tank => <Tank key={tank.tankId} tank={tank} />).toArray()}
          </g>
          <g role="helmet-layer">
            {activeTanks
              .map(
                tank =>
                  tank.helmetDuration > 0 ? (
                    <TankHelmet key={tank.tankId} x={tank.x} y={tank.y} />
                  ) : null,
              )
              .toArray()}
          </g>
          {/* 因为坦克/子弹可以"穿过"森林, 所以<ForestLayer />需要放在tank-layer和bullet-layer的后面 */}
          <ForestLayer forests={forests} />
          <RestrictedAreaLayer areas={restrictedAreas} />
          <g role="power-up-layer">
            {powerUps
              .map(powerUp => <PowerUp key={powerUp.powerUpId} powerUp={powerUp} />)
              .toArray()}
          </g>
          <g role="explosion-layer">
            {explosions.map(exp => <Explosion key={exp.explosionId} explosion={exp} />).toArray()}
          </g>
          <g role="flicker-layer">
            {flickers
              .map(flicker => <Flicker key={flicker.flickerId} flicker={flicker} />)
              .toArray()}
          </g>
          <g role="score-layer">
            {scores.map(s => <Score key={s.scoreId} score={s.score} x={s.x} y={s.y} />).toArray()}
          </g>
          <PosInfoGraph />
          <TankPath />
        </g>
        <TextLayer texts={texts} />
      </g>
    )
  }
}

export default connect(_.identity)(GameScene as any)
