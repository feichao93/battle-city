import { BLOCK_DISTANCE_THRESHOLD, BLOCK_TIMEOUT } from '../constants'
import type Tank from '../entities/Tank'
import { getDirectionInfo } from '../physics/geometry'
import type { Direction, Input } from '../types'
import { RelativePosition } from './env'
import { getTankSpot, spotToTankPos } from './spots'

/** 沿本段方向还剩多少就算到达；只用来吸收浮点误差 */
const REACH_EPS = 0.01

export type FollowStatus = 'moving' | 'arrived' | 'blocked'

/**
 * 沿 spot 路径行进：朝同一方向的连续 spot 合并成一段，每段先转向再前进。
 * 只给出移动意图、不改坦克坐标：前进时用 maxDistance 正好停在目标上；冲过目标（冰面滑行）
 * 也算到达，偏差由下一次垂直转向时驱动层的 8px 吸附消掉。受阻靠比较相邻两次 step 之间的坐标。
 * BotBrain 和 TeammateBrain 共用
 */
export default class PathFollower {
  private path: number[] = []
  private pathIndex = 0
  private turning = false
  private segDir: Direction = 'down'
  private segAxis: 'x' | 'y' = 'y'
  private segSign = 1
  private segTarget = 0
  /** 路径已走完 */
  done = true

  private blockAcc = 0
  private lastX = 0
  private lastY = 0

  /** 已朝向本段方向、还没走到头时返回这个方向：这时前方挡路的东西就在路线上 */
  advancing(tank: Tank): Direction | null {
    if (this.done || this.turning || tank.direction !== this.segDir) {
      return null
    }
    const ahead = (this.segTarget - tank[this.segAxis]) * this.segSign
    return ahead > REACH_EPS ? this.segDir : null
  }

  /** 本段要走的方向，可能还没转过去；路径走完为 null */
  heading(): Direction | null {
    return this.done ? null : this.segDir
  }

  /** path 为 null 或少于 2 个点时返回 false，由调用方决定等待还是换目标 */
  begin(tank: Tank, path: number[] | null): boolean {
    if (path == null || path.length < 2) {
      return false
    }
    this.path = path
    this.pathIndex = Math.max(0, path.indexOf(getTankSpot(tank)))
    this.blockAcc = 0
    this.lastX = tank.x
    this.lastY = tank.y
    this.nextSegment(tank)
    return true
  }

  /** 本 tick 的移动意图；连续 BLOCK_TIMEOUT 没有位移（冻结除外）返回 blocked */
  step(tank: Tank, delta: number): { move: Input | null; status: FollowStatus } {
    if (this.detectBlocked(tank, delta)) {
      return { move: null, status: 'blocked' }
    }
    // 冰面锁定期里转向不生效，朝向对不上就一直要求转向
    if (this.turning || tank.direction !== this.segDir) {
      this.turning = false
      return { move: { type: 'turn', direction: this.segDir }, status: 'moving' }
    }
    const ahead = (this.segTarget - tank[this.segAxis]) * this.segSign
    if (ahead <= REACH_EPS) {
      this.nextSegment(tank)
      return { move: null, status: this.done ? 'arrived' : 'moving' }
    }
    return { move: { type: 'forward', maxDistance: ahead }, status: 'moving' }
  }

  private nextSegment(tank: Tank): void {
    if (this.pathIndex >= this.path.length - 1) {
      this.done = true
      return
    }
    const deltaStep = this.path[this.pathIndex + 1] - this.path[this.pathIndex]
    let step = 1
    while (
      this.pathIndex + step + 1 < this.path.length &&
      this.path[this.pathIndex + step + 1] - this.path[this.pathIndex + step] === deltaStep
    ) {
      step += 1
    }
    this.pathIndex += step
    const targetPos = spotToTankPos(this.path[this.pathIndex])
    this.segDir = new RelativePosition(tank, targetPos).getPrimaryDirection()
    const { axis, delta } = getDirectionInfo(this.segDir)
    this.segAxis = axis
    this.segSign = delta
    this.segTarget = targetPos[axis]
    this.turning = true
    this.done = false
  }

  private detectBlocked(tank: Tank, delta: number): boolean {
    let blocked = false
    if (tank.frozenTimeout > 0) {
      this.blockAcc = 0
    } else {
      const moved = Math.abs(tank.x - this.lastX) + Math.abs(tank.y - this.lastY)
      this.blockAcc = moved <= BLOCK_DISTANCE_THRESHOLD ? this.blockAcc + delta : 0
      if (this.blockAcc >= BLOCK_TIMEOUT) {
        this.blockAcc = 0
        blocked = true
      }
    }
    this.lastX = tank.x
    this.lastY = tank.y
    return blocked
  }
}
