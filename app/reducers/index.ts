import { List } from 'immutable'
import { routerReducer } from 'react-router-redux'
import { combineReducers } from 'redux'
import devOnly from '../components/dev-only/reducer'
import MapRecord from '../types/MapRecord'
import PlayerRecord from '../types/PlayerRecord'
import StageConfig from '../types/StageConfig'
import { A, Action } from '../utils/actions'
import bullets, { BulletsMap } from './bullets'
import explosions, { ExplosionsMap } from './explosions'
import flickers, { FlickersMap } from './flickers'
import game, { GameRecord } from './game'
import map from './map'
import { player1, player2 } from './players'
import powerUps, { PowerUpsMap } from './powerUps'
import scores, { ScoresMap } from './scores'
import stages from './stages'
import tanks, { TanksMap } from './tanks'
import texts, { TextsMap } from './texts'

export interface State {
  router: any
  game: GameRecord
  player1: PlayerRecord
  player2: PlayerRecord
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
  if (action.type === A.Tick) {
    return state + action.delta
  } else {
    return state
  }
}

export function editorContent(state = new StageConfig(), action: Action) {
  if (action.type === A.SetEditorContent) {
    return action.stage
  } else {
    return state
  }
}

export default combineReducers<State>({
  router: routerReducer,
  game,
  player1,
  player2,
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
