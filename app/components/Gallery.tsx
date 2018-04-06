import { Map, Range } from 'immutable'
import PropTypes from 'prop-types'
import React from 'react'
import { Redirect, Route } from 'react-router'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { time } from '../reducers'
import game, { GameRecord } from '../reducers/game'
import players from '../reducers/players'
import tickEmitter from '../sagas/tickEmitter'
import { BulletRecord, PlayerRecord, PowerUpRecord, TankRecord } from '../types'
import {
  BLOCK_SIZE as B,
  FIELD_BLOCK_SIZE as FBZ,
  ITEM_SIZE_MAP,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from '../utils/constants'
import history from '../utils/history'
import BrickWall from './BrickWall'
import Bullet from './Bullet'
import HUD from './HUD'
import PowerUp from './PowerUp'
import Score from './Score'
import Screen from './Screen'
import StatisticsScene from './StatisticsScene'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'
import TextWithLineWrap from './TextWithLineWrap'

const withContext = require('recompose/withContext').default

namespace GalleryContent {
  const powerUpNames: PowerUpName[] = ['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel']

  interface TransformProps {
    x?: number
    y?: number
    k?: number
    children: any
  }

  const Transform = ({ x = 0, y = 0, k = 1, children }: TransformProps) => (
    <g transform={`translate(${x}, ${y}) scale(${k})`}>{children}</g>
  )
  const X2Tank = ({ x, y, side, color = 'auto', level, hp = 1, withPowerUp }: any) => (
    <Transform x={x} y={y} k={2}>
      <Tank tank={new TankRecord({ side, color, level, hp, withPowerUp })} />
    </Transform>
  )
  const GrayText = (props: any) => <Text fill="#ccc" {...props} />

  export class Tanks extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="tanks" fill="#dd2664" />
          <Transform y={32}>
            <GrayText x={8} y={8} content="human" />
            <GrayText x={8} y={20} content="tanks" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="human" level="basic" color="yellow" />
              <X2Tank x={48 * 1} y={0} side="human" level="fast" color="yellow" />
              <X2Tank x={48 * 2} y={0} side="human" level="power" color="yellow" />
              <X2Tank x={48 * 3} y={0} side="human" level="armor" color="yellow" />
            </Transform>
          </Transform>
          <Transform y={80}>
            <GrayText x={8} y={8} content="AI" />
            <GrayText x={8} y={20} content="tanks" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="ai" level="basic" color="silver" />
              <X2Tank x={48 * 1} y={0} side="ai" level="fast" color="silver" />
              <X2Tank x={48 * 2} y={0} side="ai" level="power" color="silver" />
              <X2Tank x={48 * 3} y={0} side="ai" level="armor" color="silver" />
            </Transform>
          </Transform>
          <Transform y={128}>
            <GrayText x={8} y={0} content="armor" />
            <GrayText x={8} y={12} content="tank" />
            <GrayText x={8} y={24} content="hp 1-4" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="ai" level="armor" hp={1} />
              <X2Tank x={48 * 1} y={0} side="ai" level="armor" hp={2} />
              <X2Tank x={48 * 2} y={0} side="ai" level="armor" hp={3} />
              <X2Tank x={48 * 3} y={0} side="ai" level="armor" hp={4} />
            </Transform>
          </Transform>
          <Transform y={176}>
            <GrayText x={8} y={0} content="tank" />
            <GrayText x={8} y={12} content="with" />
            <GrayText x={8} y={24} content="powerup" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="ai" level="basic" withPowerUp />
              <X2Tank x={48 * 1} y={0} side="ai" level="fast" withPowerUp />
              <X2Tank x={48 * 2} y={0} side="ai" level="power" withPowerUp />
              <X2Tank x={48 * 3} y={0} side="ai" level="armor" withPowerUp />
            </Transform>
          </Transform>
        </g>
      )
    }
  }

  export class Texts extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="Texts" fill="#dd2664" />
          <Transform x={8} y={40} k={2}>
            <Text x={0} y={0} content="abcdefg" fill="#feac4e" />
            <Text x={64} y={0} content="hijklmn" fill="#feac4e" />
            <Text x={0} y={12} content="opq rst" fill="#feac4e" />
            <Text x={64} y={12} content="uvw xyz" fill="#feac4e" />
            <Text x={0} y={24} content={'\u2160 \u2161 \u2190-\u2192'} fill="#feac4e" />
            <Text x={62} y={24} content={':+- .\u00a9?'} fill="#feac4e" />
          </Transform>
        </g>
      )
    }
  }

  export class Fire extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="Bullets" fill="#dd2664" />
          <Transform x={8} y={40} k={2}>
            <Bullet bullet={new BulletRecord({ direction: 'right' })} />
          </Transform>
        </g>
      )
    }
  }

  // TODO 让这个场景动起来
  export class TitleScene extends React.PureComponent {
    render() {
      const size = ITEM_SIZE_MAP.BRICK
      const scale = 4
      return (
        <g>
          <Text x={8} y={8} content="title-scene" fill="#dd2664" />
          <Transform k={0.8} x={25} y={32}>
            <g className="game-title-scene">
              <defs>
                <pattern
                  id="pattern-brickwall"
                  width={size * 2 / scale}
                  height={size * 2 / scale}
                  patternUnits="userSpaceOnUse"
                >
                  <g transform={`scale(${1 / scale})`}>
                    <BrickWall x={0} y={0} />
                    <BrickWall x={0} y={size} />
                    <BrickWall x={size} y={0} />
                    <BrickWall x={size} y={size} />
                  </g>
                </pattern>
              </defs>
              <rect fill="#000000" width={16 * B} height={15 * B} />
              <g transform="scale(0.5)">
                <TextButton
                  textFill="#96d332"
                  x={22 * B}
                  y={B}
                  content="star me on github"
                  onClick={() => window.open('https://github.com/shinima/battle-city')}
                />
              </g>
              <Text content={'\u2160-    00 HI- 20000'} x={1 * B} y={1.5 * B} />
              <g transform={`scale(${scale})`}>
                <Text
                  content="battle"
                  x={1.5 * B / scale}
                  y={3 * B / scale}
                  fill="url(#pattern-brickwall)"
                />
                <Text
                  content="city"
                  x={3.5 * B / scale + 1}
                  y={5.5 * B / scale}
                  fill="url(#pattern-brickwall)"
                />
              </g>
              <TextButton
                content="1 player"
                x={5.5 * B}
                y={8.5 * B}
                textFill="white"
                onMouseOver={() => this.setState({ choice: '1-player' })}
              />
              <TextButton
                content="stage list"
                x={5.5 * B}
                y={9.5 * B}
                textFill="white"
                onMouseOver={() => this.setState({ choice: 'stage-list' })}
              />
              <TextButton
                content="gallery"
                x={5.5 * B}
                y={10.5 * B}
                textFill="white"
                onMouseOver={() => this.setState({ choice: 'gallery' })}
              />
              <Tank
                tank={
                  new TankRecord({
                    side: 'human',
                    direction: 'right',
                    color: 'yellow',
                    moving: true,
                    x: 4 * B,
                    y: 8.25 * B,
                  })
                }
              />

              <Text content={'\u00a9 1980 1985 NAMCO LTD.'} x={2 * B} y={12.5 * B} />
              <Text content="ALL RIGHTS RESERVED" x={3 * B} y={13.5 * B} />
            </g>
          </Transform>
        </g>
      )
    }
  }

  // TODO 让这个场景动起来
  export class Statistics extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="Statistics" fill="#dd2664" />
          <Transform k={0.4} x={25} y={32}>
            <StatisticsScene />
          </Transform>
        </g>
      )
    }
  }

  export class Gameover extends React.PureComponent {
    render() {
      const size = ITEM_SIZE_MAP.BRICK
      const scale = 4
      return (
        <g>
          <Text x={8} y={8} content="gameover" fill="#dd2664" />
          <Transform k={0.8} x={25} y={32}>
            <defs>
              <pattern
                id="pattern-brickwall"
                width={size * 2 / scale}
                height={size * 2 / scale}
                patternUnits="userSpaceOnUse"
              >
                <g transform={`scale(${1 / scale})`}>
                  <BrickWall x={0} y={0} />
                  <BrickWall x={0} y={size} />
                  <BrickWall x={size} y={0} />
                  <BrickWall x={size} y={size} />
                </g>
              </pattern>
            </defs>
            <rect fill="#000000" x={0} y={0} width={16 * B} height={15 * B} />
            <g transform={`scale(${scale})`}>
              <Text
                content="game"
                x={4 * B / scale}
                y={4 * B / scale}
                fill="url(#pattern-brickwall)"
              />
              <Text
                content="over"
                x={4 * B / scale}
                y={7 * B / scale}
                fill="url(#pattern-brickwall)"
              />
            </g>
            <g transform={`translate(${5.75 * B}, ${13 * B}) scale(0.5)`}>
              <TextButton content="press R to restart" x={0} y={0} textFill="#9ed046" />
            </g>
          </Transform>
        </g>
      )
    }
  }

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
  const storeAndTask = initGalleryStoreAndTask()

  @withContext({ store: PropTypes.any }, () => ({ store: storeAndTask.store }))
  export class Misc extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="misc" fill="#dd2664" />
          <Transform x={16} y={32}>
            <GrayText content="HUD" />
            <Transform y={16}>
              <rect width={16 + 4} height={128 + 4} fill="#757575" />
              <Transform x={-232} y={-24}>
                <HUD />
              </Transform>
            </Transform>
          </Transform>
          <Transform x={72} y={32}>
            <GrayText content="powerups" />
            <Transform y={16} k={1.5}>
              {powerUpNames.map((powerUpName, index) => (
                <PowerUp
                  key={powerUpName}
                  powerUp={new PowerUpRecord({ y: 16 * index, powerUpName })}
                />
              ))}
            </Transform>
          </Transform>
          <Transform x={152} y={32}>
            <GrayText content="scores" />
            <Transform y={16} k={1.5}>
              <Score y={0} score={100} />
              <Score y={16} score={200} />
              <Score y={32} score={300} />
              <Score y={48} score={400} />
              <Score y={64} score={500} />
            </Transform>
          </Transform>
        </g>
      )
    }
  }

  export class Info extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="misc" fill="#dd2664" />
          <TextWithLineWrap
            x={8}
            y={32}
            maxLength={28}
            content="This remake is coded by shifeichao."
          />
        </g>
      )
    }
  }
}
class DashLines extends React.PureComponent<{ t?: number }> {
  render() {
    const { t } = this.props
    const hrow = Math.floor(t / FBZ)
    const hcol = t % FBZ

    return (
      <g className="dash-lines" stroke="steelblue" strokeWidth="0.5" strokeDasharray="2 2">
        {Range(1, FBZ + 1)
          .map(col => (
            <line
              key={col}
              x1={B * col}
              y1={0}
              x2={B * col}
              y2={SCREEN_HEIGHT}
              strokeOpacity={hcol === col || hcol === col - 1 ? 1 : 0.3}
            />
          ))
          .toArray()}
        {Range(1, FBZ + 1)
          .map(row => (
            <line
              key={row}
              x1={0}
              y1={B * row}
              x2={SCREEN_WIDTH}
              y2={B * row}
              strokeOpacity={hrow === row || hrow === row - 1 ? 1 : 0.3}
            />
          ))
          .toArray()}
      </g>
    )
  }
}

const tabs = ['tanks', 'texts', 'fire', 'misc', 'title-scene', 'statistics', 'gameover', 'info']

class Gallery extends React.PureComponent<{ tab: string }> {
  onChoosePrevTab = () => {
    const { tab } = this.props
    const index = tabs.indexOf(tab)
    history.replace(`/gallery/${tabs[index - 1]}`)
  }
  onChooseNextTab = () => {
    const { tab } = this.props
    const index = tabs.indexOf(tab)
    history.replace(`/gallery/${tabs[index + 1]}`)
  }

  render() {
    const { tab } = this.props
    const index = tabs.indexOf(tab)
    return (
      <Screen background="#333">
        <DashLines t={-1} />
        <g transform={`translate(${8 * B}, 8)`}>
          <TextButton
            x={0 * B}
            content="prev"
            onClick={this.onChoosePrevTab}
            disabled={index === 0}
          />
          <TextButton
            x={2.5 * B}
            content="next"
            onClick={this.onChooseNextTab}
            disabled={index === tabs.length - 1}
          />
          <TextButton x={5 * B} content="back" onClick={() => history.goBack()} />
        </g>
        {tab === 'tanks' && <GalleryContent.Tanks />}
        {tab === 'texts' && <GalleryContent.Texts />}
        {tab === 'fire' && <GalleryContent.Fire />}
        {tab === 'title-scene' && <GalleryContent.TitleScene />}
        {tab === 'statistics' && <GalleryContent.Statistics />}
        {tab === 'gameover' && <GalleryContent.Gameover />}
        {tab === 'misc' && <GalleryContent.Misc />}
        {tab === 'info' && <GalleryContent.Info />}
      </Screen>
    )
  }
}

export default () => (
  <Route
    path="/gallery/:tab"
    children={({ match }) => {
      if (match != null && tabs.includes(match.params.tab)) {
        return <Gallery tab={match.params.tab} />
      } else {
        return <Redirect to={`/gallery/${tabs[0]}`} />
      }
    }}
  />
)
