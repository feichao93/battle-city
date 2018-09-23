import { Map } from 'immutable'
import React from 'react'
import { Redirect, Route } from 'react-router'
import { combineReducers } from 'redux'
import { all } from 'redux-saga/effects'
import saga from '../hocs/saga'
import rootReducer, { State, time } from '../reducers'
import game, { GameRecord } from '../reducers/game'
import tanks from '../reducers/tanks'
import animateStatistics from '../sagas/animateStatistics'
import fireDemoSaga from '../sagas/fireDemoSaga'
import tickEmitter from '../sagas/tickEmitter'
import { PlayerRecord, PowerUpRecord, TankRecord } from '../types'
import { BLOCK_SIZE as B } from '../utils/constants'
import history from '../utils/history'
import { BattleFieldContent } from './BattleFieldScene'
import { GameoverSceneContent } from './GameoverScene'
import { GameTitleSceneContent } from './GameTitleScene'
import Grid from './Grid'
import { HUDContent } from './HUD'
import PauseIndicator from './PauseIndicator'
import PowerUp from './PowerUp'
import Score from './Score'
import Screen from './Screen'
import { StatisticsSceneContent } from './StatisticsScene'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'
import TextWithLineWrap from './TextWithLineWrap'

const noop = () => 0

function ticked(fn: any) {
  return function*() {
    yield all([tickEmitter(), fn()])
  }
}

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

  @saga(tickEmitter, combineReducers({ time, game }))
  export class Tanks extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="tanks" fill="#dd2664" />
          <Transform y={32}>
            <GrayText x={8} y={8} content="player" />
            <GrayText x={8} y={20} content="tanks" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="player" level="basic" color="yellow" />
              <X2Tank x={48 * 1} y={0} side="player" level="fast" color="yellow" />
              <X2Tank x={48 * 2} y={0} side="player" level="power" color="yellow" />
              <X2Tank x={48 * 3} y={0} side="player" level="armor" color="yellow" />
            </Transform>
          </Transform>
          <Transform y={80}>
            <GrayText x={8} y={8} content="bot" />
            <GrayText x={8} y={20} content="tanks" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="bot" level="basic" color="silver" />
              <X2Tank x={48 * 1} y={0} side="bot" level="fast" color="silver" />
              <X2Tank x={48 * 2} y={0} side="bot" level="power" color="silver" />
              <X2Tank x={48 * 3} y={0} side="bot" level="armor" color="silver" />
            </Transform>
          </Transform>
          <Transform y={128}>
            <GrayText x={8} y={0} content="armor" />
            <GrayText x={8} y={12} content="tank" />
            <GrayText x={8} y={24} content="hp 1-4" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="bot" level="armor" hp={1} />
              <X2Tank x={48 * 1} y={0} side="bot" level="armor" hp={2} />
              <X2Tank x={48 * 2} y={0} side="bot" level="armor" hp={3} />
              <X2Tank x={48 * 3} y={0} side="bot" level="armor" hp={4} />
            </Transform>
          </Transform>
          <Transform y={176}>
            <GrayText x={8} y={0} content="tank" />
            <GrayText x={8} y={12} content="with" />
            <GrayText x={8} y={24} content="powerup" />
            <Transform x={64}>
              <X2Tank x={48 * 0} y={0} side="bot" level="basic" withPowerUp />
              <X2Tank x={48 * 1} y={0} side="bot" level="fast" withPowerUp />
              <X2Tank x={48 * 2} y={0} side="bot" level="power" withPowerUp />
              <X2Tank x={48 * 3} y={0} side="bot" level="armor" withPowerUp />
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
          <Transform x={8} y={64} k={2}>
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

  @saga(fireDemoSaga, rootReducer)
  export class Fire extends React.PureComponent<Partial<State>> {
    render() {
      const { game } = this.props
      return (
        <g>
          <Text x={8} y={8} content="fire" fill="#dd2664" />
          <Transform x={16} y={40} k={2}>
            <defs>
              <clipPath id="fire-demo">
                <rect width={112} height={32} />
                <rect y={48} width={112} height={32} />
              </clipPath>
            </defs>
            <g clipPath="url(#fire-demo)">
              <BattleFieldContent {...this.props} />
            </g>
          </Transform>
          <Transform x={16} y={40}>
            {game.paused ? <PauseIndicator content="paused" noflash /> : null}
            {game.paused ? <PauseIndicator content="paused" noflash y={6 * B} /> : null}
          </Transform>
          <Transform x={0.5 * B} y={13.5 * B} k={0.5}>
            <Text fill="#999" content="Hint: Press ESC to pause" />
          </Transform>
        </g>
      )
    }
  }

  export class TitleScene extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="title-scene" fill="#dd2664" />
          <Transform k={0.8} x={25} y={32}>
            <GameTitleSceneContent push={noop} />
          </Transform>
        </g>
      )
    }
  }

  const player1KillInfo = Map<TankLevel, number>([
    ['basic', 10],
    ['fast', 4],
    ['power', 0],
    ['armor', 1],
  ])
  const player2KillInfo = Map<TankLevel, number>([
    ['basic', 4],
    ['fast', 0],
    ['power', 2],
    ['armor', 1],
  ])
  const StatisticsPreloadedState = {
    game: new GameRecord({
      currentStageName: 'gallery',
      killInfo: Map<PlayerName, typeof player1KillInfo>([
        ['player-1', player1KillInfo],
        ['player-2', player2KillInfo],
      ]),
    }),
  }
  @saga(ticked(animateStatistics), combineReducers({ game }), StatisticsPreloadedState)
  export class Statistics extends React.PureComponent {
    render() {
      const { game } = this.props as { game: GameRecord }
      return (
        <g>
          <Text x={8} y={8} content="Statistics" fill="#dd2664" />
          <Transform k={0.8} x={25} y={32}>
            <StatisticsSceneContent
              game={game}
              inMultiPlayersMode={true}
              player1Score={1000}
              player2Score={12345}
            />
          </Transform>
        </g>
      )
    }
  }

  export class Gameover extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="gameover" fill="#dd2664" />
          <Transform k={0.8} x={25} y={32}>
            <GameoverSceneContent />
          </Transform>
        </g>
      )
    }
  }

  const player1 = new PlayerRecord({ playerName: 'player-1', lives: 3 })
  const player2 = new PlayerRecord({ playerName: 'player-2', lives: 1 })

  export class Misc extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="misc" fill="#dd2664" />
          <Transform x={16} y={32}>
            <GrayText content="HUD" />
            <Transform k={0.5} y={10}>
              <GrayText content="head up display" />
            </Transform>
            <Transform y={16}>
              <rect width={16 + 4} height={128 + 4} fill="#757575" />
              <HUDContent
                player1={player1}
                player2={player2}
                remainingBotCount={17}
                show
                inMultiPlayersMode
              />
            </Transform>
          </Transform>
          <Transform x={96} y={32}>
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
          <Transform x={176} y={32}>
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
          <Transform y={64}>
            <TextWithLineWrap
              x={8}
              y={0}
              maxLength={28}
              content="This remake version is codedby shinima on github."
            />
            <TextButton
              x={96 + 24}
              y={12}
              content="github."
              onClick={() => window.open('https://github.com/shinima/battle-city')}
              stroke="#9ed046"
            />
            <TextWithLineWrap x={8} y={40} maxLength={28} content="Welcome fork and star." />
          </Transform>
        </g>
      )
    }
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
    const NavText = ({ content, x }: { content: string; x: number }) => (
      <TextButton
        textFill={content === tab ? '#999' : '#444'}
        x={x}
        content={content}
        onClick={() => history.replace(`/gallery/${content}`)}
      />
    )

    return (
      <Screen background="#333">
        <Grid />
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
        <g transform={`translate(${0.5 * B}, ${14.5 * B}) scale(0.5)`}>
          <NavText x={0} content="tanks" />
          <NavText x={0} content="tanks" />
          <NavText x={3 * B} content="texts" />
          <NavText x={6 * B} content="fire" />
          <NavText x={8.5 * B} content="misc" />
          <NavText x={11 * B} content="title-scene" />
          <NavText x={17 * B} content="statistics" />
          <NavText x={22.5 * B} content="gameover" />
          <NavText x={27 * B} content="info" />
        </g>
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
