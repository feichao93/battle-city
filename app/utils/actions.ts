import { Map, Set } from 'immutable'
import {
  BulletRecord,
  ExplosionRecord,
  FlickerRecord,
  MapRecord,
  PlayerRecord,
  PowerUpRecord,
  ScoreRecord,
  TankRecord,
  TextRecord,
} from 'types'

declare global {
  type Action = Action.Action

  namespace Action {
    export type Action =
      | Move
      | StartMoveAction
      | TickAction
      | AfterTickAction
      | AddBulletAction
      | SetCooldownAction
      | SetHelmetDurationAction
      | SetFrozenTimeoutAction
      | SetAIFrozenTimeoutAction
      | BeforeRemoveBulletAction
      | RemoveBulletAction
      | RemoveSteelsAction
      | RemoveBricksAction
      | UpdateMapAction
      | UpdaetBulletsAction
      | LoadStageMapAction
      | BeforeStartStage
      | StartStage
      | Simple<'BEFORE_END_STAGE'>
      | Simple<'END_STAGE'>
      | Simple<'BEFORE_GAMEOVER'>
      | Simple<'GAMEOVER'>
      | GameStart
      | Simple<'GAMEPAUSE'>
      | Simple<'GAMERESUME'>
      | Simple<'SHOW_HUD'>
      | Simple<'HIDE_HUD'>
      | Simple<'SHOW_STATISTICS'>
      | Simple<'HIDE_STATISTICS'>
      | Simple<'REMOVE_FIRST_REMAINING_ENEMY'>
      | IncrementPlayerLifeAction
      | DecrementPlayerLifeAction
      | ActivatePlayer
      | AddPlayer
      | RemovePlayer
      | Simple<'DEACTIVATE_ALL_PLAYERS'>
      | AddOrUpdateExplosion
      | RemoveExplosionAction
      | SetText
      | UpdateTextPositionAction
      | Simple<'DESTROY_EAGLE'>
      | StartSpawnTank
      | AddTank
      | StartMoveAction
      | RemoveTank
      | StopMoveAction
      | RemoveText
      | RemoveFlickerAction
      | AddOrUpdateFlickerAction
      | Hit
      | Hurt
      | Kill
      | IncKillCount
      | UpdateTransientKillInfo
      | Simple<'SHOW_TOTAL_KILL_COUNT'>
      | AddOrUpdatePowerUp
      | RemovePowerUp
      | RemovePowerUpProperty
      | Simple<'CLEAR_ALL_POWER_UPS'>
      | PickPowerUpAction
      | AddScoreAction
      | RemoveScoreAction
      | UpgardeTankAction
      | UpdateCurtainAction
      | SetReversedTank
      | ClearBullets
      | UpdateComingStageName
      | AddRestrictedArea
      | RemoveRestrictedArea
      | SetAITankPath
      | RemoveAITankPath

    export interface Move {
      type: 'MOVE'
      tank: TankRecord
    }

    export interface Hit {
      type: 'HIT'
      bullet: BulletRecord
      targetTank: TankRecord
      sourceTank: TankRecord
      targetPlayer: PlayerRecord
      sourcePlayer: PlayerRecord
    }

    export interface Hurt {
      type: 'HURT'
      targetTank: TankRecord
    }

    export interface Kill {
      type: 'KILL'
      targetTank: TankRecord
      sourceTank: TankRecord
      targetPlayer: PlayerRecord
      sourcePlayer: PlayerRecord
      method: 'bullet' | 'grenade'
    }

    export interface UpdateTransientKillInfo {
      type: 'UPDATE_TRANSIENT_KILL_INFO'
      info: Map<PlayerName, Map<TankLevel, KillCount>>
    }

    export interface IncKillCount {
      type: 'INC_KILL_COUNT'
      playerName: PlayerName
      level: TankLevel
    }

    export interface StartMoveAction {
      type: 'START_MOVE'
      tankId: TankId
    }

    export interface StopMoveAction {
      type: 'STOP_MOVE'
      tankId: TankId
    }

    export interface TickAction {
      type: 'TICK'
      delta: number
    }

    export interface AfterTickAction {
      type: 'AFTER_TICK'
      delta: number
    }

    export interface AddBulletAction {
      type: 'ADD_BULLET'
      bullet: BulletRecord
    }

    export interface SetHelmetDurationAction {
      type: 'SET_HELMET_DURATION'
      tankId: TankId
      duration: number
    }

    export interface SetCooldownAction {
      type: 'SET_COOLDOWN'
      tankId: TankId
      cooldown: number
    }

    export interface SetFrozenTimeoutAction {
      type: 'SET_FROZEN_TIMEOUT'
      tankId: TankId
      frozenTimeout: number
    }

    export interface SetAIFrozenTimeoutAction {
      type: 'SET_AI_FROZEN_TIMEOUT'
      AIFrozenTimeout: number
    }

    export interface BeforeRemoveBulletAction {
      type: 'BEFORE_REMOVE_BULLET'
      bulletId: BulletId
    }

    export interface RemoveBulletAction {
      type: 'REMOVE_BULLET'
      bulletId: BulletId
    }

    export interface RemoveSteelsAction {
      type: 'REMOVE_STEELS'
      ts: Set<SteelIndex>
    }

    export interface RemoveBricksAction {
      type: 'REMOVE_BRICKS'
      ts: Set<BrickIndex>
    }

    export interface UpdateMapAction {
      type: 'UPDATE_MAP'
      map: MapRecord
    }

    export interface UpdaetBulletsAction {
      type: 'UPDATE_BULLETS'
      updatedBullets: Map<BulletId, BulletRecord>
    }

    export interface LoadStageMapAction {
      type: 'LOAD_STAGE_MAP'
      name: string
    }

    export interface UpdateComingStageName {
      type: 'UPDATE_COMING_STAGE_NAME'
      stageName: string
    }

    export interface BeforeStartStage {
      type: 'BEFORE_START_STAGE'
      name: string
    }

    export interface StartStage {
      type: 'START_STAGE'
      name: string
    }

    export interface AddOrUpdateExplosion {
      type: 'ADD_OR_UPDATE_EXPLOSION'
      explosion: ExplosionRecord
    }

    export interface RemoveExplosionAction {
      type: 'REMOVE_EXPLOSION'
      explosionId: ExplosionId
    }

    export interface AddOrUpdateFlickerAction {
      type: 'ADD_OR_UPDATE_FLICKER'
      flicker: FlickerRecord
    }

    export interface RemoveFlickerAction {
      type: 'REMOVE_FLICKER'
      flickerId: FlickerId
    }

    export interface StartSpawnTank {
      type: 'START_SPAWN_TANK'
      tank: TankRecord
    }

    export interface AddTank {
      type: 'ADD_TANK'
      tank: TankRecord
    }

    export interface RemoveTank {
      type: 'REMOVE_TANK'
      tankId: TankId
    }

    export interface ActivatePlayer {
      type: 'ACTIVATE_PLAYER'
      playerName: PlayerName
      tankId: TankId
    }

    export interface AddPlayer {
      type: 'ADD_PLAYER'
      player: PlayerRecord
    }

    export interface RemovePlayer {
      type: 'REMOVE_PALYER'
      playerName: PlayerName
    }

    export interface SetText {
      type: 'SET_TEXT'
      text: TextRecord
    }

    export interface RemoveText {
      type: 'REMOVE_TEXT'
      textId: TextId
    }

    export interface UpdateTextPositionAction {
      type: 'UPDATE_TEXT_POSITION'
      textIds: Array<TextId>
      direction: Direction
      distance: number
    }

    export interface DecrementPlayerLifeAction {
      type: 'DECREMENT_PLAYER_LIFE'
      playerName: PlayerName
    }

    export interface GameStart {
      type: 'GAMESTART'
      stageIndex: number
      // TODO 需要指定是单人游戏还是双人游戏
    }

    export interface AddOrUpdatePowerUp {
      type: 'ADD_OR_UPDATE_POWER_UP'
      powerUp: PowerUpRecord
    }

    export interface RemovePowerUp {
      type: 'REMOVE_POWER_UP'
      powerUpId: PowerUpId
    }

    export interface RemovePowerUpProperty {
      type: 'REMOVE_POWER_UP_PROPERTY'
      tankId: TankId
    }

    export interface PickPowerUpAction {
      type: 'PICK_POWER_UP'
      player: PlayerRecord
      tank: TankRecord
      powerUp: PowerUpRecord
    }

    export interface AddScoreAction {
      type: 'ADD_SCORE'
      score: ScoreRecord
    }

    export interface RemoveScoreAction {
      type: 'REMOVE_SCORE'
      scoreId: ScoreId
    }

    export interface IncrementPlayerLifeAction {
      type: 'INCREMENT_PLAYER_LIFE'
      playerName: PlayerName
    }

    export interface UpgardeTankAction {
      type: 'UPGRADE_TANK'
      tankId: TankId
    }

    export interface UpdateCurtainAction {
      type: 'UPDATE_CURTAIN'
      curtainName: 'stage-enter-cutain'
      t: number
    }

    export interface SetReversedTank {
      type: 'SET_REVERSED_TANK'
      playerName: PlayerName
      reversedTank: TankRecord
    }

    export interface ClearBullets {
      type: 'CLEAR_BULLETS'
    }

    export interface Simple<T> {
      type: T
    }

    export interface AddRestrictedArea {
      type: 'ADD_RESTRICTED_AREA'
      areaId: AreaId
      area: Rect
    }

    export interface RemoveRestrictedArea {
      type: 'REMOVE_RESTRICTED_AREA'
      areaId: AreaId
    }

    export interface SetAITankPath {
      type: 'SET_AI_TANK_PATH'
      playerName: string
      path: number[]
    }

    export interface RemoveAITankPath {
      type: 'REMOVE_AI_TANK_PATH'
      playerName: string
    }
  }
}
