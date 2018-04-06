import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import { List } from 'immutable'
import game, { GameRecord } from 'reducers/game'
import players, { PlayersMap } from 'reducers/players'
import bullets, { BulletsMap } from 'reducers/bullets'
import explosions, { ExplosionsMap } from 'reducers/explosions'
import flickers, { FlickersMap } from 'reducers/flickers'
import map from 'reducers/map'
import tanks, { TanksMap } from 'reducers/tanks'
import texts, { TextsMap } from 'reducers/texts'
import powerUps, { PowerUpsMap } from 'reducers/powerUps'
import scores, { ScoresMap } from 'reducers/scores'
import stages from 'reducers/stages'
import devOnly from 'components/dev-only/reducer'
import MapRecord from '../types/MapRecord'
import StageConfig from '../types/StageConfig'

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
