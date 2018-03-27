import React from 'react'
import { Map } from 'immutable'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import { Provider } from 'react-redux'
import createSagaMiddleware from 'redux-saga'
import BrickLayer from 'components/BrickLayer'
import Bullet from 'components/Bullet'
import Eagle from 'components/Eagle'
import Explosion from 'components/Explosion'
import Flicker from 'components/Flicker'
import ForestLayer from 'components/ForestLayer'
import GameoverScene from 'components/GameoverScene'
import GameTitleScene from 'components/GameTitleScene'
import HUD from 'components/HUD'
import { default as PowerUpBase } from 'components/PowerUp'
import RiverLayer from 'components/RiverLayer'
import Score from 'components/Score'
import SnowLayer from 'components/SnowLayer'
import StatisticsScene from 'components/StatisticsScene'
import SteelLayer from 'components/SteelLayer'
import { Tank } from 'components/tanks'
import Text from 'components/Text'
import registerTick from 'hocs/registerTick'
import game, { GameRecord } from 'reducers/game'
import { time } from 'reducers'
import players from 'reducers/players'
import tickEmitter from 'sagas/tickEmitter'
import defaultStages from 'stages'
import { BLOCK_SIZE as B, FIELD_BLOCK_SIZE as FBZ } from 'utils/constants'
import {
  BulletRecord,
  FlickerRecord,
  PlayerRecord,
  PowerUpRecord,
  TankRecord,
  ExplosionRecord,
} from 'types'

// 在 Gallery 页面使用简化的 galleryStore 代替全局 store
// 简化版的 store 没有与 router 绑定，所以不用担心子组件 dispatch push/replace 会改变页面 url
function initGalleryStoreAndTask() {
  const gallerySagaMiddleware = createSagaMiddleware()
  const simpleActionLogMiddleware = () => (next: any) => (action: Action) => {
    if (DEV.LOG && action.type !== 'TICK' && action.type !== 'AFTER_TICK') {
      console.log(action)
    }
    return next(action)
  }
  const galleryReducer = combineReducers({
    time,
    players,
    game,
  })
  const galleryInitState = {
    time: undefined as number,
    game: new GameRecord({ showHUD: true }),
    players: Map({
      'player-1': new PlayerRecord({
        playerName: 'player-1',
        lives: 3,
      }),
      'player-2': new PlayerRecord({
        playerName: 'player-2',
        lives: 1,
      }),
    }),
  }
  const store = createStore(
    galleryReducer,
    galleryInitState,
    applyMiddleware(gallerySagaMiddleware, simpleActionLogMiddleware),
  )
  const task = gallerySagaMiddleware.run(tickEmitter, Infinity, false)

  return { store, task }
}

const BulletExplosion = (registerTick as any)(666, 667, 667)(({ tickIndex, x, y }: any) => (
  <Explosion
    explosion={
      new ExplosionRecord({
        cx: x + 8,
        cy: y + 8,
        shape: `s${tickIndex}` as ExplosionShape,
      })
    }
  />
))
const TankExplosion = (registerTick as any)(1000, 1000)(({ tickIndex, x, y }: any) => (
  <Explosion
    explosion={
      new ExplosionRecord({
        cx: x + 16,
        cy: y + 16,
        shape: `b${tickIndex}` as ExplosionShape,
      })
    }
  />
))
const PowerUp = ({ name, x, y }: { name: PowerUpName; x: number; y: number }) => (
  <PowerUpBase powerUp={new PowerUpRecord({ powerUpName: name, x, y, visible: true })} />
)

const Transform = ({ dx = 0, dy = 0, k = 1, children }: any) => (
  <g transform={`translate(${dx}, ${dy}) scale(${k})`}>{children}</g>
)

const X4 = ({ width = 64, height = 64, children, style = {} }: any) => (
  <svg className="svg" width={width} height={height} style={{ marginRight: 4, ...style }}>
    <Transform k={4}>{children}</Transform>
  </svg>
)

const Row = ({ children }: { children: JSX.Element[] }) => (
  <div style={{ display: 'flex' }}>{children}</div>
)

const X8Tank = ({ tank }: { tank: TankRecord }) => (
  <X4>
    <Tank tank={tank.merge({ x: 0, y: 0 })} />
  </X4>
)
const X4Text = ({ content }: { content: string }) => (
  <X4 width={content.length * 32} height={32}>
    <Text x={0} y={0} fill="#feac4e" content={content} />
  </X4>
)

const FontLevel1 = ({ children }: { children: string }) => (
  <span style={{ fontSize: 28, lineHeight: '40px' }}>{children}</span>
)

class FlickerWrapper extends React.PureComponent {
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
      <Flicker
        flicker={
          new FlickerRecord({
            flickerId: 1,
            x: 0,
            y: 0,
            shape,
          })
        }
      />
    )
  }
}

const colors: TankColor[] = ['yellow', 'green', 'silver', 'red']
const sides: Side[] = ['ai', 'human']
const levels: TankLevel[] = ['basic', 'fast', 'power', 'armor']
const powerUpNames: PowerUpName[] = ['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel']

export default class Gallery extends React.Component<{}, { stageIndex: number }> {
  storeAndTask = initGalleryStoreAndTask()
  state = { stageIndex: 0 }

  componentWillUnmount() {
    this.storeAndTask.task.cancel()
  }

  render() {
    const stageNames = defaultStages.map(s => s.name)
    const { stageIndex } = this.state
    const { bricks, steels, rivers, snows, forests, eagle } = defaultStages.get(stageIndex).map

    return (
      <Provider store={this.storeAndTask.store}>
        <div className="gallery" style={{ fontFamily: 'monospace', margin: 8 }}>
          <FontLevel1>This page is still under construction.</FontLevel1>
          <details open>
            <summary>
              <FontLevel1>TANKS</FontLevel1>
            </summary>
            {sides.map(side => (
              <div key={side}>
                <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>
                  {side} {levels.join('/')}
                </p>
                <Row>
                  {[0, 1, 2, 3].map(index => (
                    <X8Tank
                      key={index}
                      tank={
                        new TankRecord({
                          side,
                          level: levels[index],
                          color: colors[index],
                        })
                      }
                    />
                  ))}
                </Row>
              </div>
            ))}
            <div>
              <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>armor tank hp 1/2/3/4</p>
              <Row>
                {[1, 2, 3, 4].map(hp => (
                  <X8Tank
                    key={hp}
                    tank={
                      new TankRecord({
                        side: 'ai',
                        level: 'armor',
                        hp,
                      })
                    }
                  />
                ))}
              </Row>
            </div>
            <div>
              <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>
                tank with power up basic/fast/power/armor
              </p>
              <Row>
                {levels.map(level => (
                  <X8Tank
                    key={level}
                    tank={
                      new TankRecord({
                        side: 'ai',
                        level,
                        withPowerUp: true,
                      })
                    }
                  />
                ))}
              </Row>
            </div>
          </details>
          <details open>
            <summary>
              <p style={{ fontSize: 30, lineHeight: '50px', margin: 0 }}>
                Stage:
                <select
                  value={defaultStages.get(stageIndex).name}
                  onChange={e => this.setState({ stageIndex: Number(e.target.value) })}
                >
                  {stageNames.map((name, index) => (
                    <option key={index} value={index}>
                      stage-{name}
                    </option>
                  ))}
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
              <Eagle x={eagle.x} y={eagle.y} broken={eagle.broken} />
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
                <Bullet bullet={new BulletRecord({ x: 3, y: 3, direction: 'up' })} />
                <Bullet bullet={new BulletRecord({ x: 9, y: 9, direction: 'down' })} />
              </X4>
              <X4>
                <FlickerWrapper />
              </X4>
            </Row>
            <Row>
              <X4>
                <Bullet bullet={new BulletRecord({ x: 3, y: 3, direction: 'left' })} />
                <Bullet bullet={new BulletRecord({ x: 9, y: 9, direction: 'right' })} />
              </X4>
              <X4>
                <BulletExplosion x={0} y={0} />
              </X4>
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
              {powerUpNames.map((name, index) => (
                <PowerUp key={name} name={name} x={index * 24 + 4} y={4} />
              ))}
            </X4>
          </details>
          <details open>
            <summary>
              <FontLevel1>Scores</FontLevel1>
            </summary>
            <Row>
              <X4>
                <Score score={100} />
              </X4>
              <X4>
                <Score score={200} />
              </X4>
              <X4>
                <Score score={300} />
              </X4>
              <X4>
                <Score score={400} />
              </X4>
              <X4>
                <Score score={500} />
              </X4>
            </Row>
          </details>
        </div>
      </Provider>
    )
  }
}
