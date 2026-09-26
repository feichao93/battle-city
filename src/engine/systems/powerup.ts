import { around, getTankSpot } from '../ai/spots'
import { calculateFireEstimateMap, getFireResist } from '../ai/fire-estimate'
import { BLOCK_SIZE, FIELD_BLOCK_SIZE, frame } from '../constants'
import type PowerUp from '../entities/PowerUp'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import { testCollide, type Rect } from '../physics/geometry'
import type { PowerUpName } from '../types'

/** 道具闪烁：每 8 帧切换可见性；推进并移除已拾取/过期的道具 */
export function updatePowerUps(powerUps: PowerUp[], delta: number): void {
  for (const p of powerUps) {
    p.blinkTimer += delta
    if (p.blinkTimer >= frame(8)) {
      p.blinkTimer -= frame(8)
      p.visible = !p.visible
    }
  }
  let w = 0
  for (let r = 0; r < powerUps.length; r += 1) {
    if (!powerUps[r].dead) {
      powerUps[w++] = powerUps[r]
    }
  }
  powerUps.length = w
}

/** 道具显示 16×16，碰撞为居中 8×8，由四个 4×4 象限组成 */
function quadrantCollisions(map: TerrainMap, x: number, y: number): number {
  const parts: Rect[] = [
    { x: x + 4, y: y + 4, width: 4, height: 4 },
    { x: x + 8, y: y + 4, width: 4, height: 4 },
    { x: x + 4, y: y + 8, width: 4, height: 4 },
    { x: x + 8, y: y + 8, width: 4, height: 4 },
  ]
  const eagleRect: Rect | null =
    map.eagle != null
      ? { x: map.eagle.x, y: map.eagle.y, width: BLOCK_SIZE, height: BLOCK_SIZE }
      : null
  let count = 0
  for (const part of parts) {
    if (
      map.brickIndicesIn(part).length > 0 ||
      map.steelIndicesIn(part).length > 0 ||
      map.collideRiver(part, 0) ||
      (eagleRect != null && testCollide(eagleRect, part))
    ) {
      count += 1
    }
  }
  return count
}

/** 合法的道具生成位置：紧贴 1~3 个障碍象限（既非全空旷也非全堵死） */
export function validPowerUpPositions(map: TerrainMap): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = []
  const max = (FIELD_BLOCK_SIZE - 1) * BLOCK_SIZE
  for (let y = 0; y < max; y += 0.5 * BLOCK_SIZE) {
    for (let x = 0; x < max; x += 0.5 * BLOCK_SIZE) {
      const c = quadrantCollisions(map, x, y)
      if (c >= 1 && c <= 3) {
        positions.push({ x, y })
      }
    }
  }
  return positions
}

/**
 * 决定生成哪种道具：老鹰暴露 → 偏 shovel；玩家仍是 basic → 偏 star；否则随机。
 * 抄 app/sagas/powerUpManager.ts determineWhichPowerUpToSpawn。
 */
export function determinePowerUpName(
  map: TerrainMap,
  playerTanks: Tank[],
  random: () => number,
): PowerUpName {
  if (map.eagle != null) {
    const eagleSpot = getTankSpot(map.eagle)
    const estMap = calculateFireEstimateMap(around(eagleSpot), map)
    const exposed = [...estMap.keys()].some(
      (t) => t !== eagleSpot && getFireResist(estMap.get(t)!) === 0,
    )
    if (exposed && random() < 0.5) {
      return 'shovel'
    }
  }
  if (playerTanks.some((t) => t.level === 'basic') && random() < 0.4) {
    return 'star'
  }
  const names: PowerUpName[] = ['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel']
  return names[Math.floor(random() * names.length)]
}
