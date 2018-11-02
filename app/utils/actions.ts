/** 本文件中定义了游戏中用到的所有 redux action
 * 一个 action 包括了三个部分的内容，注意新增或是移除 action 时需要同步地修改这三个部分
 * 第一部分为 action type，定义在 enum A 中
 * 第二部分为 action 本身的 TS 类型，注意需要将该 TS type alias 放到文件下方的 type union 中
 * 第三部分为 action creator
 * */

import { Map, Set } from 'immutable'
import {
  BulletRecord,
  ExplosionRecord,
  FlickerRecord,
  MapRecord,
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
  SetBotFrozenTimeout = 'SetBotFrozenTimeout',
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
  RemoveFirstRemainingBot = 'RemoveFirstRemainingBot',
  IncrementPlayerLife = 'IncrementPlayerLife',
  DecrementPlayerLife = 'DecrementPlayerLife',
  BorrowPlayerLife = 'BorrowPlayerLife',
  ActivatePlayer = 'ActivatePlayer',
  ReqAddPlayerTank = 'ReqAddPlayerTank',
  ReqAddBot = 'ReqAddAIPlayer',
  SetExplosion = 'AddOrUpdateExplosion',
  RemoveExplosion = 'RemoveExplosion',
  SetText = 'SetText',
  MoveTexts = 'UpdateTextPosition',
  DestroyEagle = 'DestroyEagle',
  StartSpawnTank = 'StartSpawnTank',
  SetPlayerTankSpawningStatus = 'SetPlayerTankSpawningStatus',
  SetIsSpawningBotTank = 'SetIsSpawningBotTankStatus',
  AddTank = 'AddTank',
  StartMove = 'StartMove',
  SetTankToDead = 'SetTankToDead',
  StopMove = 'StopMove',
  RemoveText = 'RemoveText',
  RemoveFlicker = 'RemoveFlicker',
  SetFlicker = 'AddOrUpdateFlicker',
  Hit = 'Hit',
  Hurt = 'Hurt',
  Kill = 'Kill',
  IncKillCount = 'IncKillCount',
  IncPlayerScore = 'IncPlayerScore',
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
  SetTankVisibility = 'SetTankVisibility',
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
export function hit(bullet: BulletRecord, targetTank: TankRecord, sourceTank: TankRecord) {
  return {
    type: A.Hit as A.Hit,
    bullet,
    targetTank,
    sourceTank,
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
export function kill(targetTank: TankRecord, sourceTank: TankRecord, method: 'bullet' | 'grenade') {
  return {
    type: A.Kill as A.Kill,
    targetTank,
    sourceTank,
    method,
  }
}

export type UpdateTransientKillInfo = ReturnType<typeof updateTransientKillInfo>
export function updateTransientKillInfo(info: Map<PlayerName, Map<TankLevel, number>>) {
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

export type IncPlayerScore = ReturnType<typeof incPlayerScore>
export function incPlayerScore(playerName: PlayerName, count: number) {
  return {
    type: A.IncPlayerScore as A.IncPlayerScore,
    playerName,
    count,
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

export type SetBotFrozenTimeout = ReturnType<typeof setBotFrozenTimeout>
export function setBotFrozenTimeout(timeout: number) {
  return {
    type: A.SetBotFrozenTimeout as A.SetBotFrozenTimeout,
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

export type SetExplosion = ReturnType<typeof setExplosion>
export function setExplosion(explosion: ExplosionRecord) {
  return {
    type: A.SetExplosion as A.SetExplosion,
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

export type SetFlicker = ReturnType<typeof setFlicker>
export function setFlicker(flicker: FlickerRecord) {
  return {
    type: A.SetFlicker as A.SetFlicker,
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

export type SetPlayerTankSpawningStatus = ReturnType<typeof setPlayerTankSpawningStatus>
export function setPlayerTankSpawningStatus(playerName: PlayerName, isSpawning: boolean) {
  return {
    type: A.SetPlayerTankSpawningStatus as A.SetPlayerTankSpawningStatus,
    playerName,
    isSpawning,
  }
}

export type SetIsSpawningBotTank = ReturnType<typeof setIsSpawningBotTank>
export function setIsSpawningBotTank(isSpawning: boolean) {
  return {
    type: A.SetIsSpawningBotTank as A.SetIsSpawningBotTank,
    isSpawning,
  }
}

export type AddTank = ReturnType<typeof addTank>
export function addTank(tank: TankRecord) {
  return {
    type: A.AddTank as A.AddTank,
    tank,
  }
}

export type SetTankToDead = ReturnType<typeof setTankToDead>
export function setTankToDead(tankId: TankId) {
  return {
    type: A.SetTankToDead as A.SetTankToDead,
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

export type ReqAddPlayerTank = ReturnType<typeof reqAddPlayerTank>
export function reqAddPlayerTank(playerName: PlayerName) {
  return {
    type: A.ReqAddPlayerTank as A.ReqAddPlayerTank,
    playerName,
  }
}

export type ReqAddBot = ReturnType<typeof reqAddBot>
export const reqAddBot = () => ({ type: A.ReqAddBot as A.ReqAddBot })

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

export type BorrowPlayerLife = ReturnType<typeof borrowPlayerLife>
export function borrowPlayerLife(borrower: PlayerName, lender: PlayerName) {
  return {
    type: A.BorrowPlayerLife as A.BorrowPlayerLife,
    borrower,
    lender,
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
export function pickPowerUp(playerName: PlayerName, tank: TankRecord, powerUp: PowerUpRecord) {
  return {
    type: A.PickPowerUp as A.PickPowerUp,
    playerName,
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
export function incrementPlayerLife(playerName: PlayerName, count = 1) {
  return {
    type: A.IncrementPlayerLife as A.IncrementPlayerLife,
    playerName,
    count,
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

export type SetTankVisibility = ReturnType<typeof setTankVisibility>
export function setTankVisibility(tankId: TankId, visible: boolean) {
  return {
    type: A.SetTankVisibility as A.SetTankVisibility,
    tankId,
    visible,
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
export function setAITankPath(tankId: TankId, path: number[]) {
  return { type: A.SetAITankPath as A.SetAITankPath, tankId, path }
}

export type RemoveAITankPath = ReturnType<typeof removeAITankPath>
export function removeAITankPath(tankId: TankId) {
  return {
    type: A.RemoveAITankPath as A.RemoveAITankPath,
    tankId,
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

export type BeforeEndStage = ReturnType<typeof beforeEndStage>
export const beforeEndStage = () => ({ type: A.BeforeEndStage as A.BeforeEndStage })

export type EndStage = ReturnType<typeof endStage>
export const endStage = () => ({ type: A.EndStage as A.EndStage })

export type BeforeEndGame = ReturnType<typeof beforeEndGame>
export const beforeEndGame = () => ({ type: A.BeforeEndGame as A.BeforeEndGame })

export type EndGame = ReturnType<typeof endGame>
export const endGame = () => ({ type: A.EndGame as A.EndGame })

export type ResetGame = ReturnType<typeof resetGame>
export const resetGame = () => ({ type: A.ResetGame as A.ResetGame })

export type GamePause = ReturnType<typeof gamePause>
export const gamePause = () => ({ type: A.GamePause as A.GamePause })

export type GameResume = ReturnType<typeof gameResume>
export const gameResume = () => ({ type: A.GameResume as A.GameResume })

export type ShowHud = ReturnType<typeof showHud>
export const showHud = () => ({ type: A.ShowHud as A.ShowHud })

export type HideHud = ReturnType<typeof hideHud>
export const hideHud = () => ({ type: A.HideHud as A.HideHud })

export type ShowStatistics = ReturnType<typeof showStatistics>
export const showStatistics = () => ({ type: A.ShowStatistics as A.ShowStatistics })

export type HideStatistics = ReturnType<typeof hideStatistics>
export const hideStatistics = () => ({ type: A.HideStatistics as A.HideStatistics })

export type RemoveFirstRemainingBot = ReturnType<typeof removeFirstRemainingBot>
export const removeFirstRemainingBot = () => ({
  type: A.RemoveFirstRemainingBot as A.RemoveFirstRemainingBot,
})

export type DestroyEagle = ReturnType<typeof destroyEagle>
export const destroyEagle = () => ({ type: A.DestroyEagle as A.DestroyEagle })

export type ShowTotalKillCount = ReturnType<typeof showTotalKillCount>
export const showTotalKillCount = () => ({ type: A.ShowTotalKillCount as A.ShowTotalKillCount })

export type ClearAllPowerUps = ReturnType<typeof clearAllPowerUps>
export const clearAllPowerUps = () => ({ type: A.ClearAllPowerUps as A.ClearAllPowerUps })

export type ClearBullets = ReturnType<typeof clearBullets>
export const clearBullets = () => ({ type: A.ClearBullets as A.ClearBullets })

export type SyncCustomStages = ReturnType<typeof syncCustomStages>
export const syncCustomStages = () => ({ type: A.SyncCustomStages as A.SyncCustomStages })

export type LeaveGameScene = ReturnType<typeof leaveGameScene>
export const leaveGameScene = () => ({ type: A.LeaveGameScene as A.LeaveGameScene })

export type Action =
  | Move
  | StartMove
  | Tick
  | AfterTick
  | AddBullet
  | SetCooldown
  | SetHelmetDuration
  | SetFrozenTimeout
  | SetBotFrozenTimeout
  | BeforeRemoveBullet
  | RemoveBullet
  | RemoveSteels
  | RemoveBricks
  | UpdateMap
  | UpdateBulelts
  | LoadStageMap
  | BeforeStartStage
  | StartStage
  | BeforeEndStage
  | EndStage
  | BeforeEndGame
  | EndGame
  | StartGame
  | ResetGame
  | GamePause
  | GameResume
  | ShowHud
  | HideHud
  | ShowStatistics
  | HideStatistics
  | RemoveFirstRemainingBot
  | IncrementPlayerLife
  | DecrementPlayerLife
  | BorrowPlayerLife
  | ActivatePlayer
  | ReqAddPlayerTank
  | ReqAddBot
  | SetExplosion
  | RemoveExplosion
  | SetText
  | MoveTexts
  | DestroyEagle
  | StartSpawnTank
  | SetPlayerTankSpawningStatus
  | SetIsSpawningBotTank
  | AddTank
  | SetTankToDead
  | StopMove
  | RemoveText
  | RemoveFlicker
  | SetFlicker
  | Hit
  | Hurt
  | Kill
  | IncKillCount
  | IncPlayerScore
  | UpdateTransientKillInfo
  | ShowTotalKillCount
  | SetPowerUp
  | RemovePowerUp
  | RemovePowerUpProperty
  | ClearAllPowerUps
  | PickPowerUp
  | AddScore
  | RemoveScore
  | UpgardeTank
  | UpdateCurtain
  | SetReservedTank
  | SetTankVisibility
  | ClearBullets
  | UpdateComingStageName
  | AddRestrictedArea
  | RemoveRestrictedArea
  | SetAITankPath
  | RemoveAITankPath
  | SetCustomStage
  | RemoveCustomStage
  | SetEditorContent
  | SyncCustomStages
  | LeaveGameScene
  | PlaySound
