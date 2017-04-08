import { Map, Set } from 'immutable'
import {
  TankId,
  PlayerName,
  BulletId,
  BrickIndex,
  RiverIndex,
  SteelIndex,
  Direction,
  ExplosionId,
  ExplosionType,
  TextId,
  FlickerId,
  Side,
} from 'types'
import TankRecord from 'types/TankRecord'
import BulletRecord from 'types/BulletRecord'

export type Action = MoveAction | StartMoveAction | TickAction | AfterTickAction
  | AddBulletAction | DestroyBulletsAction | DestroySteelsAction | DestroyBricksAction
  | UpdaetBulletsAction | LoadStageAction | Simple<'GAMEOVER'> | ShowOverlayAction
  | RemoveOverlayAction | Simple<'DECREMENT_ENEMY_COUNT'> | DecrementPlayerLiveAction
  | ActivatePlayerAction | CreatePlayerAction | RemovePlayerAction | Simple<'DEACTIVATE_ALL_PLAYERS'>
  | SpawnExplosionAction | RemoveExplosionAction | SetTextAction | UpdateTextPositionAction
  | Simple<'DESTROY_EAGLE'> | Simple<'ALL_USERS_DEAD'> | SpawnTankAction | StartMoveAction
  | RemoveTankAction | StopMoveAction | RemoveTextAction | RemoveFlickerAction | SpawnFlickerAction

export type ActionType = Action['type']

export type MoveAction = {
  type: 'MOVE',
  tankId: TankId,
  tank: TankRecord,
}

export type StartMoveAction = {
  type: 'START_MOVE',
  tankId: TankId,
}

export type StopMoveAction = {
  type: 'STOP_MOVE',
  tankId: TankId,
}

export type TickAction = {
  type: 'TICK',
  delta: number,
}

export type AfterTickAction = {
  type: 'AFTER_TICK',
  delta: number,
}

export type AddBulletAction = {
  type: 'ADD_BULLET',
  bulletId: BulletId,
  direction: Direction,
  speed: number,
  x: number,
  y: number,
  power?: number,
  tankId: TankId,
}

export type DestroyBulletsAction = {
  type: 'DESTROY_BULLETS',
  bullets: Map<BulletId, BulletRecord>,
  spawnExplosion: boolean,
}

export type DestroySteelsAction = {
  type: 'DESTROY_STEELS',
  ts: Set<SteelIndex>,
}

export type DestroyBricksAction = {
  type: 'DESTROY_BRICKS',
  ts: Set<BrickIndex>,
}

export type UpdaetBulletsAction = {
  type: 'UPDATE_BULLETS',
  updatedBullets: Map<BulletId, BulletRecord>,
}

export type LoadStageAction = {
  type: 'LOAD_STAGE',
  name: string,
}

export type SpawnExplosionAction = {
  type: 'SPAWN_EXPLOSION',
  x: number,
  y: number,
  explosionId: ExplosionId,
  explosionType: ExplosionType,
}

export type RemoveExplosionAction = {
  type: 'REMOVE_EXPLOSION',
  explosionId: ExplosionId,
}

export type SpawnFlickerAction = {
  type: 'SPAWN_FLICKER',
  flickerId: FlickerId,
  x: number,
  y: number,
}

export type RemoveFlickerAction = {
  type: 'REMOVE_FLICKER',
  flickerId: FlickerId,
}

export type SpawnTankAction = {
  type: 'SPAWN_TANK',
  side: Side,
  tankId: TankId,
  x: number,
  y: number,
  direction: Direction,
}

export type RemoveTankAction = {
  type: 'REMOVE_TANK',
  tankId: TankId,
}

export type ActivatePlayerAction = {
  type: 'ACTIVATE_PLAYER',
  playerName: PlayerName,
  tankId: TankId,
}

export type CreatePlayerAction = {
  type: 'CREATE_PLAYER',
  playerName: PlayerName,
  lives: number,
}

export type RemovePlayerAction = {
  type: 'REMOVE_PLAYER',
  playerName: PlayerName,
}

export type SetTextAction = {
  type: 'SET_TEXT',
  textId: TextId,
  content: string,
  fill: string,
  x: number,
  y: number,
}

export type RemoveTextAction = {
  type: 'REMOVE_TEXT',
  textId: TextId,
}

export type UpdateTextPositionAction = {
  type: 'UPDATE_TEXT_POSITION',
  textIds: Array<TextId>,
  direction: Direction,
  distance: number,
}

export type DecrementPlayerLiveAction = {
  type: 'DECREMENT_PLAYER_LIVE',
  playerName: PlayerName,
}

export type ShowOverlayAction = {
  type: 'SHOW_OVERLAY',
  overlay: string,
}

export type RemoveOverlayAction = {
  type: 'REMOVE_OVERLAY',
}

export type Simple<T> = {
  type: T
}
