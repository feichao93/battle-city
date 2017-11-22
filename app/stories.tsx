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
import GameTitleScene from 'components/GameTitleScene'
import StatisticsScene from 'components/StatisticsScene'
import HUD from 'components/HUD'
import Score from 'components/Score'
import { default as PowerUpBase } from 'components/PowerUp'
import Explosion from 'components/Explosion'
import parseStageMap from 'utils/parseStageMap'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE as FBZ } from 'utils/constants'
import tickEmitter from 'sagas/tickEmitter'
import stageConfigs from 'stages/index'
import registerTick from 'hocs/registerTick'
import { BulletRecord, FlickerRecord, PlayerRecord, PowerUpRecord, TankRecord } from 'types'

// TODO 修复这里的BUG
const BulletExplosion = registerTick(1000, 1000, 1000)(Explosion)
const TankExplosion = registerTick(1000, 1000)(Explosion)
const PowerUp = ({ name, x, y }: { name: PowerUpName, x: number, y: number }) => (
  <PowerUpBase powerUp={PowerUpRecord({ powerUpName: name, x, y, visible: true })} />
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

const X4 = ({ width = 64, height = 64, children, style = {} }: any) => (
  <svg className="svg" width={width} height={height} style={{ marginRight: 4, ...style }}>
    <Transform k={4}>
      {children}
    </Transform>
  </svg>
)

const Row = ({ children }: { children: JSX.Element[] }) => (
  <div style={{ display: 'flex' }}>
    {children}
  </div>
)

const X8Tank = ({ tank }: { tank: TankRecord }) => (
  <X4><Tank tank={tank.merge({ x: 0, y: 0 })} /></X4>
)
const X4Text = ({ content }: { content: string }) => (
  <X4 width={content.length * 32} height={32}>
    <Text x={0} y={0} fill="#feac4e" content={content} />
  </X4>
)

const FontLevel1 = ({ children }: { children: string }) => (
  <span style={{ fontSize: 28, lineHeight: '40px' }}>{children}</span>
)

class FlickerStory extends React.PureComponent {
  private handle: any
  state = {
    shape: 0 as FlickerShape,
  }

  componentDidMount() {
    this.handle = setInterval(() => this.setState({ shape: (this.state.shape + 1) % 4 }), 500)
  }

  componentWillUnmount() {
    clearInterval(this.handle)
  }

  render() {
    const { shape } = this.state
    return (
      <Flicker flicker={FlickerRecord({
        flickerId: 1,
        x: 0,
        y: 0,
        shape,
      })} />
    )
  }
}

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
              <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>{side} {levels.join('/')}</p>
              <Row>
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
              </Row>
            </div>
          )}
          <div>
            <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>armor tank hp 1/2/3/4</p>
            <Row>
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
            </Row>
          </div>
          <div>
            <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>tank with power up basic/fast/power/armor</p>
            <Row>
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
            </Row>
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
            width={FBZ * B * 2}
            height={FBZ * B * 2}
            viewBox={`0 0 ${FBZ * B} ${FBZ * B}`}
          >
            <rect width={FBZ * B} height={FBZ * B} fill="#000000" />
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
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>Texts</FontLevel1>
          </summary>
          <X4Text content="abcdefg" />
          <X4Text content="hijklmn" />
          <X4Text content="opq rst" />
          <X4Text content="uvw xyz" />
          <X4Text content={'\u2160 \u2161 \u2190-\u2192'} />
          <X4Text content={':+- .\u00a9?'} />
        </details>
        <details open>
          <summary>
            <FontLevel1>Bullets &amp; Explosions &amp; Flickers</FontLevel1>
          </summary>
          <Row>
            <X4>
              <Bullet bullet={BulletRecord({ x: 3, y: 3, direction: 'up' })} />
              <Bullet bullet={BulletRecord({ x: 9, y: 9, direction: 'down' })} />
            </X4>
            <X4><FlickerStory /></X4>
          </Row>
          <Row>
            <X4>
              <Bullet bullet={BulletRecord({ x: 3, y: 3, direction: 'left' })} />
              <Bullet bullet={BulletRecord({ x: 9, y: 9, direction: 'right' })} />
            </X4>
            <X4><BulletExplosion x={0} y={0} /></X4>
          </Row>
          <X4 width={128} height={128}>
            <TankExplosion x={0} y={0} />
          </X4>
        </details>
        <details open>
          <summary>
            <FontLevel1>Scene: game-title</FontLevel1>
          </summary>
          <svg className="svg" width={256 * 1.5} height={240 * 1.5}>
            <Transform k={1.5}>
              <GameTitleScene />
            </Transform>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>Scene: stage statistics</FontLevel1>
          </summary>
          <svg className="svg" width={256 * 1.5} height={240 * 1.5}>
            <Transform k={1.5}>
              <StatisticsScene />
            </Transform>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>Scene: gameover</FontLevel1>
          </summary>
          <svg className="svg" width={256 * 1.5} height={240 * 1.5}>
            <Transform k={1.5}>
              <GameoverScene />
            </Transform>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>HUD</FontLevel1>
          </summary>
          <svg className="svg" width={50} height={270}>
            <Transform k={2} dx={-232 * 2 + 8} dy={-24 * 2 + 4}>
              <HUD />
            </Transform>
          </svg>
        </details>
        <details open>
          <summary>
            <FontLevel1>PowerUp</FontLevel1>
          </summary>
          <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>
            tank / star / grenade / timer / helmet / shoval
          </p>
          <X4 width={496} height={96} style={{ background: 'black' }}>
            {powerUpNames.map((name, index) =>
              <PowerUp
                key={name}
                name={name}
                x={index * 24 + 4}
                y={4}
              />
            )}
          </X4>
        </details>
        <details open>
          <summary>
            <FontLevel1>Scores</FontLevel1>
          </summary>
          <Row>
            <X4><Score score={100} /></X4>
            <X4><Score score={200} /></X4>
            <X4><Score score={300} /></X4>
            <X4><Score score={400} /></X4>
            <X4><Score score={500} /></X4>
          </Row>
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
