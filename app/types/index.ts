// 敌人描述, 例如: basic*20, fast*10
type Enemy = string
export type StageConfig = {
  name: string
  difficulty: 'easy' | 'normal' | 'hard'
  map: string[]
  enemies: Enemy
}

export { default as TankRecord } from 'types/TankRecord'
export { default as FlickerRecord } from 'types/FlickerRecord'
export { default as TextRecord } from 'types/TextRecord'
export { default as BulletRecord } from 'types/BulletRecord'
export { EagleRecord } from "reducers/map";
export { State } from 'reducers/index'
export { PlayersMap } from 'reducers/players'
export { BulletsMap } from 'reducers/bullets'
export { TextsMap } from 'reducers/texts'
export { TanksMap } from 'reducers/tanks'

export interface HumanControllerConfig {
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

  interface Point {
    x: number
    y: number
  }

  interface Vector {
    dx: number
    dy: number
  }

  type Overlay = '' | 'gameover' | 'statistics'

  // todo 使用enemy-level来标记敌人坦克的类型
  type TankLevel = 'basic' | 'fast' | 'power' | 'armor'

  type Direction = 'up' | 'down' | 'left' | 'right'

  type TankId = number
  type BulletId = number
  /**
   * 玩家名称.
   * human-player的名称格式为 'player-x', 而AI-player的名称格式为 'AI-x'
   * 其实x表示数字1,2,3...
   */
  type PlayerName = string
  type TextId = number
  type FlickerId = number

  type SteelIndex = number
  type BrickIndex = number
  type RiverIndex = number

  type ExplosionType = 'bullet' | 'tank'
  type ExplosionId = number
  type Side = 'human' | 'ai'

  type AICommand = AICommand.AICommand

  // todo
  /** Note 包含了一些游戏逻辑向AI逻辑发送的消息/通知 */
  type Note = string

  /** AICommand 包含了一些AI逻辑向游戏逻辑发送的操作命令 */
  namespace AICommand {
    type AICommand = Forward | Fire | Turn

    interface Forward {
      type: 'forward'
      forwardLength: number
    }

    interface Fire {
      type: 'fire'
    }

    interface Turn {
      type: 'turn'
      direction: Direction
    }
  }
}
