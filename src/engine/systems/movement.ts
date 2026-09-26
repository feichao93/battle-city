import type Tank from '../entities/Tank'
import { canTankMove, type CollisionWorld } from '../physics/collision'
import { ceil8, floor8, getDirectionInfo, isPerpendicular, round8 } from '../physics/geometry'
import { SNOW_SLIDE_LOCK, SNOW_SLIDE_START, TANK_SIZE } from '../constants'
import type { AudioPort, Input } from '../types'
import { moveSpeed } from '../values'

/**
 * 转向后更新预留坐标：把「沿当前移动轴」的坐标吸附到 8 的倍数，
 * 供下次垂直转向时对齐到栅格（障碍物坐标总是 4/8 的倍数，便于穿过缝隙）。
 * 同时尝试 floor8 / ceil8，避免简单 round8 把坦克卡进障碍物。
 */
function updateReserved(world: CollisionWorld, tank: Tank): void {
  const { axis } = getDirectionInfo(tank.direction)
  const coord = tank[axis]
  const floor = floor8(coord)
  const ceil = ceil8(coord)

  tank[axis] = floor
  const canFloor = canTankMove(world, tank)
  tank[axis] = ceil
  const canCeil = canTankMove(world, tank)
  tank[axis] = coord // 还原真实坐标

  let aligned: number
  if (!canFloor) {
    aligned = ceil
  } else if (!canCeil) {
    aligned = floor
  } else {
    aligned = round8(coord)
  }

  if (axis === 'x') {
    tank.rx = aligned
    tank.ry = tank.y
  } else {
    tank.rx = tank.x
    tank.ry = aligned
  }
}

/**
 * 把一个 tick 的移动意图作用到坦克上（玩家与 bot 共用）。
 * - null：停止
 * - turn：垂直转向时吸附到预留坐标，再改朝向（不消耗本帧位移）
 * - forward：按速度前进，碰撞则回退；冻结期间不动
 * moving 仅在成功前进时置 true、在无输入时置 false，其余情况保持不变（匹配原版手感）。
 */
export function applyInput(
  world: CollisionWorld,
  tank: Tank,
  input: Input | null,
  delta: number,
): void {
  if (input == null) {
    tank.moving = false
    return
  }

  if (input.type === 'turn') {
    if (isPerpendicular(input.direction, tank.direction)) {
      tank.x = tank.rx
      tank.y = tank.ry
    }
    tank.direction = input.direction
    return
  }

  // forward
  if (tank.frozenTimeout > 0) {
    return
  }
  const distance = Math.min(delta * moveSpeed(tank), input.maxDistance ?? Infinity)
  if (moveForward(world, tank, distance)) {
    tank.moving = true
  }
}

/** 沿朝向前进 distance，撞上障碍则回退；返回是否移动成功 */
function moveForward(world: CollisionWorld, tank: Tank, distance: number): boolean {
  const { axis, delta: sign } = getDirectionInfo(tank.direction)
  const prev = tank[axis]
  tank[axis] = prev + sign * distance
  if (canTankMove(world, tank)) {
    updateReserved(world, tank)
    return true
  }
  tank[axis] = prev
  return false
}

/**
 * 玩家坦克的移动：在 applyInput 之上加冰面滑行（NES 只有玩家会滑）。
 * 是否在冰上看坦克中心所在的格子；冲出冰面立即恢复操控，剩余滑行量保留。
 */
export function applyPlayerMove(
  world: CollisionWorld,
  tank: Tank,
  input: Input | null,
  delta: number,
  audio: AudioPort,
): void {
  const onSnow = world.map.isSnowAt(tank.x + TANK_SIZE / 2, tank.y + TANK_SIZE / 2)
  let intent = input
  if (onSnow && (tank.slide > SNOW_SLIDE_LOCK || tank.frozenTimeout > 0)) {
    // 锁定期与被队友定身都按松手处理：方向键无效，只剩滑行
    intent = null
  } else if (onSnow && intent != null && tank.slide === 0) {
    tank.slide = SNOW_SLIDE_START
    audio.play('snow_slide')
  }

  if (intent == null && onSnow && tank.slide > 0) {
    const step = delta * moveSpeed(tank)
    // 被挡住时滑行量照样消耗
    moveForward(world, tank, Math.min(step, tank.slide))
    tank.slide = Math.max(0, tank.slide - step)
    // NES 滑行时履带不转
    tank.moving = false
    return
  }
  applyInput(world, tank, intent, delta)
}
