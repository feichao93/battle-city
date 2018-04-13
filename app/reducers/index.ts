import { List } from 'immutable'
import { routerReducer } from 'react-router-redux'
import { combineReducers } from 'redux'
import devOnly from '../components/dev-only/reducer'
import MapRecord from '../types/MapRecord'
import StageConfig from '../types/StageConfig'
import bullets, { BulletsMap } from './bullets'
import explosions, { ExplosionsMap } from './explosions'
import flickers, { FlickersMap } from './flickers'
import game, { GameRecord } from './game'
import map from './map'
import players, { PlayersMap } from './players'
import powerUps, { PowerUpsMap } from './powerUps'
import scores, { ScoresMap } from './scores'
import stages from './stages'
import tanks, { TanksMap } from './tanks'
import texts, { TextsMap } from './texts'

export interface State {
  router: any
  game: GameRecord
  players: PlayersMap
  bullets: BulletsMap
  explosions: ExplosionsMap
  map: MapRecord
  time: number
  tanks: TanksMap
  flickers: FlickersMap
  texts: TextsMap
  powerUps: PowerUpsMap
  scores: ScoresMap
  stages: List<StageConfig>
  editorContent: StageConfig
  devOnly: any
}

export function time(state = 0, action: Action) {
  if (action.type === 'TICK') {
    return state + action.delta
  } else {
    return state
  }
}

export function editorContent(state = new StageConfig(), action: Action) {
  if (action.type === 'SET_EDITOR_CONTENT') {
    return action.stage
  } else {
    return state
  }
}

export default combineReducers<State>({
  router: routerReducer,
  game,
  players,
  bullets,
  map,
  time,
  explosions,
  flickers,
  tanks,
  texts,
  powerUps,
  scores,
  stages,
  devOnly,
  editorContent,
})
