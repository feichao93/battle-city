export type TankId = number
export type BulletId = number
export type PlayerName = string
export type TextId = number
export type FlickerId = number

export type SteelIndex = number
export type BrickIndex = number
export type RiverIndex = number

export type Direction = 'up' | 'down' | 'left' | 'right'

export type ExplosionType = 'bullet' | 'tank'
export type ExplosionId = number
export type Side = 'user' | 'ai'

export type StageConfig = {
  name: string,
  difficulty: 'easy' | 'normal' | 'hard',
  map: string[],
}

export { default as TankRecord } from 'types/TankRecord'
export { default as FlickerRecord } from 'types/FlickerRecord'
export { default as TextRecord } from 'types/TextRecord'
export { default as BulletRecord } from 'types/BulletRecord'
export { EagleRecord } from "reducers/map";

export * from 'utils/actions'
export { State } from 'reducers/index'
export { PlayersMap } from 'reducers/players'
export { BulletsMap } from 'reducers/bullets'
export { TextsMap } from 'reducers/texts'
export { TanksMap } from 'reducers/tanks'

export interface UserControllerConfig {
  fire: string,
  up: string,
  down: string,
  left: string,
  right: string,
}

export type Input = { type: 'turn', direction: Direction }
  | { type: 'forward', maxDistance?: number }

declare global {
  interface Box {
    x: number,
    y: number,
    width: number,
    height: number,
  }
}
