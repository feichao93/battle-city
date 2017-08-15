import { Map, Set } from 'immutable'
import PlayerRecord from 'types/PlayerRecord'
import TankRecord from 'types/TankRecord'
import BulletRecord from 'types/BulletRecord'

declare global {
  type Action = Action.Action
  type ActionType = Action.ActionType

  namespace Action {
    export type Action =
      MoveAction
      | StartMoveAction
      | TickAction
      | AfterTickAction
      | AddBulletAction
      | SetCooldownAction
      | DestroyBulletsAction
      | DestroySteelsAction
      | DestroyBricksAction
      | UpdaetBulletsAction
      | LoadStageAction
      | Simple<'GAMEOVER'>
      | ShowOverlayAction
      | RemoveOverlayAction
      | Simple<'REMOVE_FIRST_REMAINING_ENEMY'>
      | DecrementPlayerLiveAction
      | ActivatePlayerAction
      | CreatePlayerAction
      | RemovePlayerAction
      | Simple<'DEACTIVATE_ALL_PLAYERS'>
      | SpawnExplosionAction
      | RemoveExplosionAction
      | SetTextAction
      | UpdateTextPositionAction
      | Simple<'DESTROY_EAGLE'>
      | SpawnTankAction
      | StartMoveAction
      | RemoveTankAction
      | StopMoveAction
      | RemoveTextAction
      | RemoveFlickerAction
      | SpawnFlickerAction
      | HurtAction
      | KillAction
      | IncKillCount
      | UpdateTransientKillInfo
      | Simple<'SHOW_TOTAL_KILL_COUNT'>

    export type ActionType = Action['type']

    export type MoveAction = {
      type: 'MOVE',
      tankId: TankId,
      tank: TankRecord,
    }

    export type HurtAction = {
      type: 'HURT'
      targetTank: TankRecord
      hurt: number
    }

    export type KillAction = {
      type: 'KILL'
      targetTank: TankRecord
      sourceTank: TankRecord
      targetPlayer: PlayerRecord
      sourcePlayer: PlayerRecord
    }

    export type UpdateTransientKillInfo = {
      type: 'UPDATE_TRANSIENT_KILL_INFO'
      info: Map<PlayerName, Map<TankLevel, KillCount>>
    }

    export type IncKillCount = {
      type: 'INC_KILL_COUNT'
      playerName: PlayerName
      level: TankLevel
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

    export type SetCooldownAction = {
      type: 'SET_COOLDOWN'
      tankId: TankId
      cooldown: number
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
      tank: TankRecord
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
      player: PlayerRecord,
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
      overlay: Overlay
    }

    export type RemoveOverlayAction = {
      type: 'REMOVE_OVERLAY',
    }

    export type Simple<T> = {
      type: T
    }
  }
}
