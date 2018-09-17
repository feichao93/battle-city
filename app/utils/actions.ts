/** 本文件中定义了游戏中用到的所有 redux action
 * 一个 action 包括了三个部分的内容，注意新增或是移除 action 时需要同步地修改这三个部分
 * 第一部分为 action type，定义在 enum A 中
 * 第二部分为 action 本身的 TS 类型，注意需要将该 TS type alias 放到文件下方的 type union 中
 * 第三部分为 action creator
 *
 * 简单的 action，即只有 action type，没有其他参数的 action，可以直接使用 simple/Simple 来创建
 * */

import { Map, Set } from 'immutable'
import {
  BulletRecord,
  ExplosionRecord,
  FlickerRecord,
  MapRecord,
  PlayerRecord,
  PowerUpRecord,
  ScoreRecord,
  StageConfig,
  TankRecord,
  TextRecord,
} from '../types'

export enum A {
  Move = 'Move',
  Tick = 'Tick',
  AfterTick = 'AfterTick',
  AddBullet = 'AddBullet',
  SetCooldown = 'SetCooldown',
  SetHelmetDuration = 'SetHelmetDuration',
  SetFrozenTimeout = 'SetFrozenTimeout',
  SetAIFrozenTimeout = 'SetAIFrozenTimeout',
  BeforeRemoveBullet = 'BeforeRemoveBullet',
  RemoveBullet = 'RemoveBullet',
  RemoveSteels = 'RemoveSteels',
  RemoveBricks = 'RemoveBricks',
  UpdateMap = 'UpdateMap',
  UpdateBullets = 'UpdateBullets',
  LoadStageMap = 'LoadStageMap',
  BeforeStartStage = 'BeforeStartStage',
  StartStage = 'StartStage',
  BeforeEndStage = 'BeforeEndStage',
  EndStage = 'EndStage',
  BeforeEndGame = 'BeforeEndGame',
  EndGame = 'EndGame',
  StartGame = 'StartGame',
  ResetGame = 'ResetGame',
  GamePause = 'GamePause',
  GameResume = 'GameResume',
  ShowHud = 'ShowHud',
  HideHud = 'HideHud',
  ShowStatistics = 'ShowStatistics',
  HideStatistics = 'HideStatistics',
  RemoveFirstRemainingEnemy = 'RemoveFirstRemainingEnemy',
  IncrementPlayerLife = 'IncrementPlayerLife',
  DecrementPlayerLife = 'DecrementPlayerLife',
  ActivatePlayer = 'ActivatePlayer',
  AddPlayer = 'AddPlayer',
  ReqAddPlayerTank = 'ReqAddPlayerTank',
  ReqAddAIPlayer = 'ReqAddAIPlayer',
  RemovePlayer = 'RemovePlayer',
  DeactivateAllPlayers = 'DeactivateAllPlayers',
  AddOrUpdateExplosion = 'AddOrUpdateExplosion',
  RemoveExplosion = 'RemoveExplosion',
  SetText = 'SetText',
  MoveTexts = 'UpdateTextPosition',
  DestroyEagle = 'DestroyEagle',
  StartSpawnTank = 'StartSpawnTank',
  AddTank = 'AddTank',
  StartMove = 'StartMove',
  DeactivateTank = 'DeactivateTank',
  StopMove = 'StopMove',
  RemoveText = 'RemoveText',
  RemoveFlicker = 'RemoveFlicker',
  AddOrUpdateFlicker = 'AddOrUpdateFlicker',
  Hit = 'Hit',
  Hurt = 'Hurt',
  Kill = 'Kill',
  IncKillCount = 'IncKillCount',
  UpdateTransientKillInfo = 'UpdateTransientKillInfo',
  ShowTotalKillCount = 'ShowTotalKillCount',
  SetPowerUp = 'SetPowerUp',
  RemovePowerUp = 'RemovePowerUp',
  RemovePowerUpProperty = 'RemovePowerUpProperty',
  ClearAllPowerUps = 'ClearAllPowerUps',
  PickPowerUp = 'PickPowerUp',
  AddScore = 'AddScore',
  RemoveScore = 'RemoveScore',
  UpgardeTank = 'UpgardeTank',
  UpdateCurtain = 'UpdateCurtain',
  SetReservedTank = 'SetReversedTank',
  ClearBullets = 'ClearBullets',
  UpdateComingStageName = 'UpdateComingStageName',
  AddRestrictedArea = 'AddRestrictedArea',
  RemoveRestrictedArea = 'RemoveRestrictedArea',
  SetAITankPath = 'SetAITankPath',
  RemoveAITankPath = 'RemoveAITankPath',
  SetCustomStage = 'SetCustomStage',
  RemoveCustomStage = 'RemoveCustomStage',
  SetEditorContent = 'SetEditorContent',
  SyncCustomStages = 'SyncCustomStages',
  LeaveGameScene = 'LeaveGameScene',
  PlaySound = 'PlaySound',
}

export type Move = ReturnType<typeof move>
export function move(tank: TankRecord) {
  return {
    type: A.Move as A.Move,
    tankId: tank.tankId,
    x: tank.x,
    y: tank.y,
    rx: tank.rx,
    ry: tank.ry,
    direction: tank.direction,
  }
}

export type StartMove = ReturnType<typeof startMove>
export function startMove(tankId: TankId) {
  return {
    type: A.StartMove as A.StartMove,
    tankId,
  }
}

export type Tick = ReturnType<typeof tick>
export function tick(delta: number) {
  return {
    type: A.Tick as A.Tick,
    delta,
  }
}

export type AfterTick = ReturnType<typeof afterTick>
export function afterTick(delta: number) {
  return {
    type: A.AfterTick as A.AfterTick,
    delta,
  }
}

export type AddBullet = ReturnType<typeof addBullet>
export function addBullet(bullet: BulletRecord) {
  return {
    type: A.AddBullet as A.AddBullet,
    bullet,
  }
}

export type SetHelmetDuration = ReturnType<typeof setHelmetDuration>
export function setHelmetDuration(tankId: TankId, duration: number) {
  return {
    type: A.SetHelmetDuration as A.SetHelmetDuration,
    tankId,
    duration,
  }
}

export type SetFrozenTimeout = ReturnType<typeof setFrozenTimeout>
export function setFrozenTimeout(tankId: TankId, frozenTimeout: number) {
  return {
    type: A.SetFrozenTimeout as A.SetFrozenTimeout,
    tankId,
    frozenTimeout,
  }
}

export type Hit = ReturnType<typeof hit>
export function hit(
  bullet: BulletRecord,
  targetTank: TankRecord,
  sourceTank: TankRecord,
  targetPlayer: PlayerRecord,
  sourcePlayer: PlayerRecord,
) {
  return {
    type: A.Hit as A.Hit,
    bullet,
    targetTank,
    sourceTank,
    targetPlayer,
    sourcePlayer,
  }
}

export type Hurt = ReturnType<typeof hurt>
export function hurt(targetTank: TankRecord) {
  return {
    type: A.Hurt as A.Hurt,
    targetTank,
  }
}

export type Kill = ReturnType<typeof kill>
export function kill(
  targetTank: TankRecord,
  sourceTank: TankRecord,
  targetPlayer: PlayerRecord,
  sourcePlayer: PlayerRecord,
  method: 'bullet' | 'grenade',
) {
  return {
    type: A.Kill as A.Kill,
    targetTank,
    sourceTank,
    targetPlayer,
    sourcePlayer,
    method,
  }
}

export type UpdateTransientKillInfo = ReturnType<typeof updateTransientKillInfo>
export function updateTransientKillInfo(info: Map<PlayerName, Map<TankLevel, KillCount>>) {
  return {
    type: A.UpdateTransientKillInfo as A.UpdateTransientKillInfo,
    info,
  }
}

export type IncKillCount = ReturnType<typeof incKillCount>
export function incKillCount(playerName: PlayerName, level: TankLevel) {
  return {
    type: A.IncKillCount as A.IncKillCount,
    playerName,
    level,
  }
}

export type StopMove = ReturnType<typeof stopMove>
export function stopMove(tankId: TankId) {
  return {
    type: A.StopMove as A.StopMove,
    tankId,
  }
}

export type SetCooldown = ReturnType<typeof setCooldown>
export function setCooldown(tankId: TankId, cooldown: number) {
  return {
    type: A.SetCooldown as A.SetCooldown,
    tankId,
    cooldown,
  }
}

export type SetAIFrozenTimeout = ReturnType<typeof setAIFrozenTimeout>
export function setAIFrozenTimeout(timeout: number) {
  return {
    type: A.SetAIFrozenTimeout as A.SetAIFrozenTimeout,
    timeout,
  }
}

export type BeforeRemoveBullet = ReturnType<typeof beforeRemoveBullet>
export function beforeRemoveBullet(bulletId: BulletId) {
  return {
    type: A.BeforeRemoveBullet as A.BeforeRemoveBullet,
    bulletId,
  }
}

export type RemoveBullet = ReturnType<typeof removeBullet>
export function removeBullet(bulletId: BulletId) {
  return {
    type: A.RemoveBullet as A.RemoveBullet,
    bulletId,
  }
}

export type RemoveSteels = ReturnType<typeof removeSteels>
export function removeSteels(ts: Set<SteelIndex>) {
  return {
    type: A.RemoveSteels as A.RemoveSteels,
    ts,
  }
}

export type RemoveBricks = ReturnType<typeof removeBricks>
export function removeBricks(ts: Set<BrickIndex>) {
  return {
    type: A.RemoveBricks as A.RemoveBricks,
    ts,
  }
}

export type UpdateMap = ReturnType<typeof updateMap>
export function updateMap(map: MapRecord) {
  return {
    type: A.UpdateMap as A.UpdateMap,
    map,
  }
}

export type UpdateBulelts = ReturnType<typeof updateBullets>
export function updateBullets(updatedBullets: Map<BulletId, BulletRecord>) {
  return {
    type: A.UpdateBullets as A.UpdateBullets,
    updatedBullets,
  }
}

export type LoadStageMap = ReturnType<typeof loadStageMap>
export function loadStageMap(stage: StageConfig) {
  return {
    type: A.LoadStageMap as A.LoadStageMap,
    stage,
  }
}

export type UpdateComingStageName = ReturnType<typeof updateComingStageName>
export function updateComingStageName(stageName: string) {
  return {
    type: A.UpdateComingStageName as A.UpdateComingStageName,
    stageName,
  }
}

export type BeforeStartStage = ReturnType<typeof beforeStartStage>
export function beforeStartStage(stage: StageConfig) {
  return {
    type: A.BeforeStartStage as A.BeforeStartStage,
    stage,
  }
}

export type StartStage = ReturnType<typeof startStage>
export function startStage(stage: StageConfig) {
  return {
    type: A.StartStage as A.StartStage,
    stage,
  }
}

export type AddOrUpdateExplosion = ReturnType<typeof addOrUpdateExplosion>
export function addOrUpdateExplosion(explosion: ExplosionRecord) {
  return {
    type: A.AddOrUpdateExplosion as A.AddOrUpdateExplosion,
    explosion,
  }
}

export type RemoveExplosion = ReturnType<typeof removeExplosion>
export function removeExplosion(explosionId: ExplosionId) {
  return {
    type: A.RemoveExplosion as A.RemoveExplosion,
    explosionId,
  }
}

export type AddOrUpdateFlicker = ReturnType<typeof addOrUpdateFlicker>
export function addOrUpdateFlicker(flicker: FlickerRecord) {
  return {
    type: A.AddOrUpdateFlicker as A.AddOrUpdateFlicker,
    flicker,
  }
}

export type RemoveFlicker = ReturnType<typeof removeFlicker>
export function removeFlicker(flickerId: FlickerId) {
  return {
    type: A.RemoveFlicker as A.RemoveFlicker,
    flickerId,
  }
}

/** 坦克开始生成的信号，用于清理场上的 power-ups */
export type StartSpawnTank = ReturnType<typeof startSpawnTank>
export function startSpawnTank(tank: TankRecord) {
  return {
    type: A.StartSpawnTank as A.StartSpawnTank,
    tank,
  }
}

export type AddTank = ReturnType<typeof addTank>
export function addTank(tank: TankRecord) {
  return {
    type: A.AddTank as A.AddTank,
    tank,
  }
}

export type DeactivateTank = ReturnType<typeof deactivateTank>
export function deactivateTank(tankId: TankId) {
  return {
    type: A.DeactivateTank as A.DeactivateTank,
    tankId,
  }
}

export type ActivatePlayer = ReturnType<typeof activatePlayer>
export function activatePlayer(playerName: PlayerName, tankId: TankId) {
  return {
    type: A.ActivatePlayer as A.ActivatePlayer,
    playerName,
    tankId,
  }
}

export type AddPlayer = ReturnType<typeof addPlayer>
export function addPlayer(player: PlayerRecord) {
  return {
    type: A.AddPlayer as A.AddPlayer,
    player,
  }
}

export type ReqAddPlayerTank = ReturnType<typeof reqAddPlayerTank>
export function reqAddPlayerTank(playerName: PlayerName) {
  return {
    type: A.ReqAddPlayerTank as A.ReqAddPlayerTank,
    playerName,
  }
}

export type ReqAddAIPlayer = ReturnType<typeof reqAddAIPlayer>
export function reqAddAIPlayer() {
  return { type: A.ReqAddAIPlayer as A.ReqAddAIPlayer }
}

export type RemovePlayer = ReturnType<typeof removePlayer>
export function removePlayer(playerName: PlayerName) {
  return {
    type: A.RemovePlayer as A.RemovePlayer,
    playerName,
  }
}

export type SetText = ReturnType<typeof setText>
export function setText(text: TextRecord) {
  return {
    type: A.SetText as A.SetText,
    text,
  }
}

export type RemoveText = ReturnType<typeof removeText>
export function removeText(textId: TextId) {
  return {
    type: A.RemoveText as A.RemoveText,
    textId,
  }
}

export type MoveTexts = ReturnType<typeof moveTexts>
export function moveTexts(textIds: TextId[], direction: Direction, distance: number) {
  return {
    type: A.MoveTexts as A.MoveTexts,
    textIds,
    direction,
    distance,
  }
}

export type DecrementPlayerLife = ReturnType<typeof decrementPlayerLife>
export function decrementPlayerLife(playerName: PlayerName) {
  return {
    type: A.DecrementPlayerLife as A.DecrementPlayerLife,
    playerName,
  }
}

export type StartGame = ReturnType<typeof startGame>
export function startGame(stageIndex: number) {
  return {
    type: A.StartGame as A.StartGame,
    stageIndex,
  }
}

export type SetPowerUp = ReturnType<typeof setPowerUp>
export function setPowerUp(powerUp: PowerUpRecord) {
  return {
    type: A.SetPowerUp as A.SetPowerUp,
    powerUp,
  }
}

export type RemovePowerUp = ReturnType<typeof removePowerUp>
export function removePowerUp(powerUpId: PowerUpId) {
  return {
    type: A.RemovePowerUp as A.RemovePowerUp,
    powerUpId,
  }
}

export type RemovePowerUpProperty = ReturnType<typeof removePowerUpProperty>
export function removePowerUpProperty(tankId: TankId) {
  return {
    type: A.RemovePowerUpProperty as A.RemovePowerUpProperty,
    tankId,
  }
}

export type PickPowerUp = ReturnType<typeof pickPowerUp>
export function pickPowerUp(player: PlayerRecord, tank: TankRecord, powerUp: PowerUpRecord) {
  return {
    type: A.PickPowerUp as A.PickPowerUp,
    player,
    tank,
    powerUp,
  }
}

export type AddScore = ReturnType<typeof addScore>
export function addScore(score: ScoreRecord) {
  return {
    type: A.AddScore as A.AddScore,
    score,
  }
}

export type RemoveScore = ReturnType<typeof removeScore>
export function removeScore(scoreId: ScoreId) {
  return {
    type: A.RemoveScore as A.RemoveScore,
    scoreId,
  }
}

export type IncrementPlayerLife = ReturnType<typeof incrementPlayerLife>
export function incrementPlayerLife(playerName: PlayerName) {
  return {
    type: A.IncrementPlayerLife as A.IncrementPlayerLife,
    playerName,
  }
}

export type UpgardeTank = ReturnType<typeof upgardeTank>
export function upgardeTank(tankId: TankId) {
  return {
    type: A.UpgardeTank as A.UpgardeTank,
    tankId,
  }
}

export type UpdateCurtain = ReturnType<typeof updateCurtain>
export function updateCurtain(curtainName: 'stage-enter-curtain', t: number) {
  return {
    type: A.UpdateCurtain as A.UpdateCurtain,
    curtainName,
    t,
  }
}

export type SetReservedTank = ReturnType<typeof setReservedTank>
export function setReservedTank(playerName: PlayerName, tank: TankRecord) {
  return {
    type: A.SetReservedTank as A.SetReservedTank,
    playerName,
    tank,
  }
}

export type AddRestrictedArea = ReturnType<typeof addRestrictedArea>
export function addRestrictedArea(areaId: AreaId, area: Rect) {
  return {
    type: A.AddRestrictedArea as A.AddRestrictedArea,
    areaId,
    area,
  }
}

export type RemoveRestrictedArea = ReturnType<typeof removeRestrictedArea>
export function removeRestrictedArea(areaId: AreaId) {
  return {
    type: A.RemoveRestrictedArea as A.RemoveRestrictedArea,
    areaId,
  }
}

export type SetAITankPath = ReturnType<typeof setAITankPath>
export function setAITankPath(playerName: PlayerName, path: number[]) {
  return {
    type: A.SetAITankPath as A.SetAITankPath,
    playerName,
    path,
  }
}

export type RemoveAITankPath = ReturnType<typeof removeAITankPath>
export function removeAITankPath(playerName: PlayerName) {
  return {
    type: A.RemoveAITankPath as A.RemoveAITankPath,
    playerName,
  }
}

export type SetCustomStage = ReturnType<typeof setCustomStage>
export function setCustomStage(stage: StageConfig) {
  return {
    type: A.SetCustomStage as A.SetCustomStage,
    stage,
  }
}

export type RemoveCustomStage = ReturnType<typeof removeCustomStage>
export function removeCustomStage(stageName: string) {
  return {
    type: A.RemoveCustomStage as A.RemoveCustomStage,
    stageName,
  }
}

export type SetEditorContent = ReturnType<typeof setEditorContent>
export function setEditorContent(stage: StageConfig) {
  return {
    type: A.SetEditorContent as A.SetEditorContent,
    stage,
  }
}

export type PlaySound = ReturnType<typeof playSound>
export function playSound(soundName: SoundName) {
  return {
    type: A.PlaySound as A.PlaySound,
    soundName,
  }
}

/** simple action creator */
export function simple<T extends A>(actionType: T) {
  return { type: actionType }
}

/** simple action type factory */
export type Simple<T extends A> = { type: T }

export type Action =
  | Move
  | StartMove
  | Tick
  | AfterTick
  | AddBullet
  | SetCooldown
  | SetHelmetDuration
  | SetFrozenTimeout
  | SetAIFrozenTimeout
  | BeforeRemoveBullet
  | RemoveBullet
  | RemoveSteels
  | RemoveBricks
  | UpdateMap
  | UpdateBulelts
  | LoadStageMap
  | BeforeStartStage
  | StartStage
  | Simple<A.BeforeEndStage>
  | Simple<A.EndStage>
  | Simple<A.BeforeEndGame>
  | Simple<A.EndGame>
  | StartGame
  | Simple<A.ResetGame>
  | Simple<A.GamePause>
  | Simple<A.GameResume>
  | Simple<A.ShowHud>
  | Simple<A.HideHud>
  | Simple<A.ShowStatistics>
  | Simple<A.HideStatistics>
  | Simple<A.RemoveFirstRemainingEnemy>
  | IncrementPlayerLife
  | DecrementPlayerLife
  | ActivatePlayer
  | AddPlayer
  | ReqAddPlayerTank
  | ReqAddAIPlayer
  | RemovePlayer
  | Simple<A.DeactivateAllPlayers>
  | AddOrUpdateExplosion
  | RemoveExplosion
  | SetText
  | MoveTexts
  | Simple<A.DestroyEagle>
  | StartSpawnTank
  | AddTank
  | DeactivateTank
  | StopMove
  | RemoveText
  | RemoveFlicker
  | AddOrUpdateFlicker
  | Hit
  | Hurt
  | Kill
  | IncKillCount
  | UpdateTransientKillInfo
  | Simple<A.ShowTotalKillCount>
  | SetPowerUp
  | RemovePowerUp
  | RemovePowerUpProperty
  | Simple<A.ClearAllPowerUps>
  | PickPowerUp
  | AddScore
  | RemoveScore
  | UpgardeTank
  | UpdateCurtain
  | SetReservedTank
  | Simple<A.ClearBullets>
  | UpdateComingStageName
  | AddRestrictedArea
  | RemoveRestrictedArea
  | SetAITankPath
  | RemoveAITankPath
  | SetCustomStage
  | RemoveCustomStage
  | SetEditorContent
  | Simple<A.SyncCustomStages>
  | Simple<A.LeaveGameScene>
  | PlaySound
