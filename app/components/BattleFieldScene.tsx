import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { State } from '../reducers'
import { BLOCK_SIZE as B } from '../utils/constants'
import BrickLayer from './BrickLayer'
import Bullet from './Bullet'
import CurtainsContainer from './CurtainsContainer'
import RestrictedAreaLayer from './dev-only/RestrictedAreaLayer'
import SpotGraph from './dev-only/SpotGraph'
import TankPath from './dev-only/TankPath'
import Eagle from './Eagle'
import Explosion from './Explosion'
import Flicker from './Flicker'
import ForestLayer from './ForestLayer'
import HUD from './HUD'
import PauseIndicator from './PauseIndicator'
import PowerUp from './PowerUp'
import RiverLayer from './RiverLayer'
import Score from './Score'
import Screen from './Screen'
import SnowLayer from './SnowLayer'
import SteelLayer from './SteelLayer'
import TankHelmet from './TankHelmet'
import { Tank } from './tanks'
import TextLayer from './TextLayer'

export class BattleFieldContent extends React.PureComponent<Partial<State & Point>> {
  render() {
    const { x = 0, y = 0, bullets, map, explosions, flickers, tanks, powerUps, scores } = this.props
    const { bricks, steels, rivers, snows, forests, eagle, restrictedAreas } = map.toObject()
    const activeTanks = tanks.filter(t => t.active)
    return (
      <g className="battle-field" transform={`translate(${x},${y})`}>
        <rect width={13 * B} height={13 * B} fill="#000000" />
        <RiverLayer rivers={rivers} />
        <SteelLayer steels={steels} />
        <BrickLayer bricks={bricks} />
        <SnowLayer snows={snows} />
        {eagle ? <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} /> : null}
        <g className="bullet-layer">
          {bullets.map((b, i) => <Bullet key={i} bullet={b} />).toArray()}
        </g>
        <g className="tank-layer">
          {activeTanks.map(tank => <Tank key={tank.tankId} tank={tank} />).toArray()}
        </g>
        <g className="helmet-layer">
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
        <g className="power-up-layer">
          {powerUps.map(powerUp => <PowerUp key={powerUp.powerUpId} powerUp={powerUp} />).toArray()}
        </g>
        <g className="explosion-layer">
          {explosions.map(exp => <Explosion key={exp.explosionId} explosion={exp} />).toArray()}
        </g>
        <g className="flicker-layer">
          {flickers.map(flicker => <Flicker key={flicker.flickerId} flicker={flicker} />).toArray()}
        </g>
        <g className="score-layer">
          {scores.map(s => <Score key={s.scoreId} score={s.score} x={s.x} y={s.y} />).toArray()}
        </g>
        <SpotGraph />
        <TankPath />
      </g>
    )
  }
}

class BattleFieldScene extends React.PureComponent<State> {
  render() {
    const { game, texts } = this.props

    return (
      <Screen>
        <HUD />
        <BattleFieldContent {...this.props} x={B} y={B} />
        <TextLayer texts={texts} />
        <CurtainsContainer />
        {game.paused ? <PauseIndicator x={6.25 * B} y={8 * B} /> : null}
      </Screen>
    )
  }
}

export default connect<State>(_.identity)(BattleFieldScene)
