import { Map, Range } from 'immutable'
import React from 'react'
import { Redirect, Route } from 'react-router'
import { GameRecord } from '../reducers/game'
import { BulletRecord, PlayerRecord, PowerUpRecord, TankRecord } from '../types'
import {
  BLOCK_SIZE as B,
  FIELD_BLOCK_SIZE as FBZ,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from '../utils/constants'
import history from '../utils/history'
import Bullet from './Bullet'
import { GameoverSceneContent } from './GameoverScene'
import { GameTitleSceneContent } from './GameTitleScene'
import { HUDContent } from './HUD'
import PowerUp from './PowerUp'
import Score from './Score'
import Screen from './Screen'
import { StatisticsSceneContent } from './StatisticsScene'
import { Tank } from './tanks'
import Text from './Text'
import TextButton from './TextButton'
import TextWithLineWrap from './TextWithLineWrap'

const noop = () => 0

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

  // TODO 让这个场景动起来
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

  // TODO 让这个场景动起来
  export class Statistics extends React.PureComponent {
    state = {
      game: new GameRecord(),
    }

    render() {
      const { game } = this.state
      return (
        <g>
          <Text x={8} y={8} content="Statistics" fill="#dd2664" />
          <Transform k={0.8} x={25} y={32}>
            <StatisticsSceneContent game={game} />
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

  const players = Map({
    'player-1': new PlayerRecord({ playerName: 'player-1', lives: 3 }),
    'player-2': new PlayerRecord({ playerName: 'player-2', lives: 1 }),
  })

  export class Misc extends React.PureComponent {
    render() {
      return (
        <g>
          <Text x={8} y={8} content="misc" fill="#dd2664" />
          <Transform x={16} y={32}>
            <GrayText content="HUD" />
            <Transform y={16}>
              <rect width={16 + 4} height={128 + 4} fill="#757575" />
              <HUDContent players={players} remainingEnemyCount={17} show />
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
