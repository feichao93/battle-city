import 'normalize.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Map } from 'immutable'
import { Provider } from 'react-redux'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import players from 'reducers/players'
import { time } from 'reducers/index'
import game from 'reducers/game'
import { Tank } from 'components/tanks'
import SnowLayer from 'components/SnowLayer'
import SteelLayer from 'components/SteelLayer'
import RiverLayer from 'components/RiverLayer'
import BrickLayer from 'components/BrickLayer'
import ForestLayer from 'components/ForestLayer'
import Text from 'components/Text'
import Eagle from 'components/Eagle'
import Bullet from 'components/Bullet'
import Flicker from 'components/Flicker'
import GameoverScene from 'components/GameoverScene'
import StatisticsScene from 'components/StatisticsScene'
import HUD from 'components/HUD'
import { PowerUpBase } from 'components/PowerUp'
import { BulletExplosionClass, TankExplosionClass } from 'components/Explosion'
import parseStageMap from 'utils/parseStageMap'
import { BLOCK_SIZE } from 'utils/constants'
import tickEmitter from 'sagas/tickEmitter'
import stageConfigs from 'stages/index'
import registerTick from 'hocs/registerTick'
import { PlayerRecord, TankRecord } from 'types'

const BulletExplosion = registerTick(500, 500, 1000)(BulletExplosionClass)
const TankExplosion = registerTick(500, 1000)(TankExplosionClass)
const PowerUp = ({ name }: any) => (
  <PowerUpBase tickIndex={0} name={name} x={0} y={0} />
)

const simpleSagaMiddleware = createSagaMiddleware()
const simpleReducer = combineReducers({ time, players, game })
const initialState = {
  time: undefined as number,
  players: Map({
    'player-1': PlayerRecord({
      playerName: 'player-1',
      lives: 3,
    }),
    'player-2': PlayerRecord({
      playerName: 'player-2',
      lives: 1,
    }),
  }),
}

const simpleStore = createStore(simpleReducer, initialState, applyMiddleware(simpleSagaMiddleware))
simpleSagaMiddleware.run(tickEmitter)

const Transform = ({ dx = 0, dy = 0, k = 1, children }: any) => (
  <g transform={`translate(${dx}, ${dy}) scale(${k})`}>
    {children}
  </g>
)

const X8 = ({ width = 128, height = 128, children }: any) => (
  <svg className="svg" width={width} height={height} style={{ marginRight: 8 }}>
    <Transform k={8}>
      {children}
    </Transform>
  </svg>
)

const X8Tank = ({ tank }: { tank: TankRecord }) => (
  <X8><Tank tank={tank.merge({ x: 0, y: 0 })} /></X8>
)
const X8Text = ({ content }: { content: string }) => (
  <X8 width={content.length * 64} height={64}>
    <Text x={0} y={0} fill="#feac4e" content={content} />
  </X8>
)

const FontLevel1 = ({ children }: any) => (
  <span style={{ fontSize: 30, lineHeight: '50px' }}>{children}</span>
)

const colors: TankColor[] = ['yellow', 'green', 'silver', 'red']
const sides: Side[] = ['ai', 'human']
const levels: TankLevel[] = ['basic', 'fast', 'power', 'armor']
const powerUpNames: PowerUpName[] = ['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel']

class Stories extends React.Component<{}, { stage: string }> {
  state = {
    stage: Object.keys(stageConfigs)[0],
  }

  render() {
    const stageNames = Object.keys(stageConfigs)
    const { stage } = this.state
    const { bricks, steels, rivers, snows, forests, eagle } = parseStageMap(stageConfigs[stage].map).toObject()

    return (
      <div className="stories" style={{ fontFamily: 'monospace', margin: 8 }}>
        <details open>
          <summary>
            <FontLevel1>TANKS</FontLevel1>
          </summary>
          {sides.map(side =>
            <div key={side}>
              <p style={{ fontSize: 20 }}>{side} {levels.join('/')}</p>
              <div style={{ display: 'flex' }}>
                {[0, 1, 2, 3].map(index =>
                  <X8Tank
                    key={index}
                    tank={TankRecord({
                      side,
                      level: levels[index],
                      color: colors[index],
                    })}
                  />
                )}
              </div>
            </div>
          )}
          <div>
            <p style={{ fontSize: 20 }}>armor tank hp 1/2/3/4</p>
            <div style={{ display: 'flex' }}>
              {[1, 2, 3, 4].map(hp =>
                <X8Tank
                  key={hp}
                  tank={TankRecord({
                    side: 'ai',
                    level: 'armor',
                    hp,
                  })}
                />
              )}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 20 }}>tank with power up basic/fast/power/armor</p>
            <div style={{ display: 'flex' }}>
              {levels.map(level =>
                <X8Tank
                  key={level}
                  tank={TankRecord({
                    side: 'ai',
                    level,
                    withPowerUp: true,
                  })}
                />
              )}
            </div>
          </div>
        </details>
        <details open>
          <summary>
            <p style={{ fontSize: 30, lineHeight: '50px', margin: 0 }}>
              Stage:
              <select
                value={stage}
                onChange={e => this.setState({ stage: e.target.value })}
              >
                {stageNames.map(name =>
                  <option key={name} value={name}>stage-{name}</option>
                )}
              </select>
            </p>
          </summary>
          <svg
            className="svg"
            width={3 * 13 * BLOCK_SIZE}
            height={3 * 13 * BLOCK_SIZE}
          >
            <g transform="scale(3)">
              <rect width={13 * BLOCK_SIZE} height={13 * BLOCK_SIZE} fill="#000000" />
              <RiverLayer rivers={rivers} />
              <SteelLayer steels={steels} />
              <BrickLayer bricks={bricks} />
              <SnowLayer snows={snows} />
              <Eagle
                x={eagle.x}
                y={eagle.y}
                broken={eagle.broken}
              />
              <ForestLayer forests={forests} />
            </g>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>Texts</FontLevel1>
          </summary>
          <X8Text content="abcdefg" />
          <X8Text content="hijklmn" />
          <X8Text content="opq rst" />
          <X8Text content="uvw xyz" />
          <X8Text content={'\u2160 \u2161 \u2190-\u2192'} />
        </details>
        <details open>
          <summary>
            <FontLevel1>Bullets &amp; Explosions &amp; Flickers</FontLevel1>
          </summary>
          <X8>
            <Bullet
              x={3}
              y={3}
              direction="up"
            />
            <Bullet
              x={9}
              y={3}
              direction="right"
            />
            <Bullet
              x={9}
              y={9}
              direction="down"
            />
            <Bullet
              x={3}
              y={9}
              direction="left"
            />
          </X8>
          <X8><BulletExplosion x={0} y={0} /></X8>
          <X8 width={256} height={256}>
            <TankExplosion x={0} y={0} />
          </X8>
          <X8>
            <Flicker x={0} y={0} />
          </X8>
        </details>
        <details open>
          <summary>
            <FontLevel1>Scene: gameover</FontLevel1>
          </summary>
          <svg className="svg" width={512} height={512}>
            <Transform k={2}>
              <GameoverScene />
            </Transform>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>Scene: stage statistics</FontLevel1>
          </summary>
          <svg className="svg" width={512} height={512}>
            <Transform k={2}>
              <StatisticsScene />
            </Transform>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>HUD</FontLevel1>
          </summary>
          <svg className="svg" width={100} height={540}>
            <Transform k={4} dx={-232 * 4 + 16} dy={-24 * 4 + 8}>
              <HUD />
            </Transform>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>PowerUp</FontLevel1>
          </summary>
          <div style={{ display: 'flex' }}>
            {powerUpNames.map(name =>
              <div key={name}>
                <p style={{ fontSize: 20 }}>{name}</p>
                <X8><PowerUp name={name} /></X8>
              </div>
            )}
          </div>
        </details>
      </div>
    )
  }
}


ReactDOM.render(
  <Provider store={simpleStore}>
    <Stories />
  </Provider>,
  document.getElementById('container')
)
