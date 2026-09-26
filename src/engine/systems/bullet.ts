import { eagleGuard } from '../ai/lane'
import { BLOCK_SIZE, BULLET_SIZE, FIELD_SIZE, STEEL_POWER } from '../constants'
import type Bullet from '../entities/Bullet'
import Explosion from '../entities/Explosion'
import type Tank from '../entities/Tank'
import type TerrainMap from '../map/TerrainMap'
import {
  borderCollisionRect,
  bulletMBR,
  explosionPosFromRects,
  getBulletCollision,
  spreadBullet,
} from '../physics/bullet-collision'
import { getDirectionInfo, testCollide, type Rect } from '../physics/geometry'
import type { AudioPort, Point } from '../types'

/** 单颗子弹本帧累积的碰撞信息 */
interface BulletCollisions {
  /** 触发爆炸的障碍矩形（砖/钢/边界/老鹰） */
  rects: Rect[]
  /** 是否应当爆炸（命中实体障碍；纯子弹对撞不爆炸） */
  explode: boolean
  /** 是否发生任何碰撞（任何碰撞都会销毁子弹） */
  any: boolean
  hitBrick: boolean
  hitSteel: boolean
  hitBorder: boolean
  /** 本帧最早一次子弹对撞时的位置；之后的路程不再参与碰撞 */
  stop: Point | null
}

function emptyCollisions(): BulletCollisions {
  return {
    rects: [],
    explode: false,
    any: false,
    hitBrick: false,
    hitSteel: false,
    hitBorder: false,
    stop: null,
  }
}

function eagleRect(eagle: Point): Rect {
  return { x: eagle.x, y: eagle.y, width: BLOCK_SIZE, height: BLOCK_SIZE }
}

function keepEarlier(b: Bullet, c: BulletCollisions, p: Point): void {
  const travelled = (q: Point) => Math.abs(q.x - b.lastX) + Math.abs(q.y - b.lastY)
  if (c.stop == null || travelled(p) < travelled(c.stop)) {
    c.stop = p
  }
}

/** 子弹命中坦克事件，交由 BattleScene 结算（扣血/击杀/冻结/失命） */
export interface BulletTankHit {
  bullet: Bullet
  target: Tank
}

/**
 * 子弹系统：移动所有子弹 → 检测碰撞（老鹰/子弹对撞/砖/钢/边界）→
 * 结算爆炸落点、破坏地形、生成爆炸、播放音效，并移除已消亡子弹。
 * 注意：子弹 vs 坦克的命中（扣血/冻结）在 P4 接入。
 * 返回本帧打掉老鹰外墙的砖或打中老鹰的 bot（tankId）。
 */
export function updateBullets(
  bullets: Bullet[],
  map: TerrainMap,
  explosions: Explosion[],
  audio: AudioPort,
  delta: number,
  tanks: Tank[],
  hits: BulletTankHit[],
): number[] {
  if (bullets.length === 0) {
    return []
  }

  // 1. 移动
  for (const b of bullets) {
    b.lastX = b.x
    b.lastY = b.y
    const { axis, delta: sign } = getDirectionInfo(b.direction)
    if (axis === 'x') {
      b.x += sign * b.speed * delta
    } else {
      b.y += sign * b.speed * delta
    }
  }

  const infoMap = new Map<number, BulletCollisions>()
  const info = (b: Bullet): BulletCollisions => {
    let c = infoMap.get(b.bulletId)
    if (c == null) {
      c = emptyCollisions()
      infoMap.set(b.bulletId, c)
    }
    return c
  }

  // 2. 子弹对撞（精确求交，双方销毁，不产生爆炸）
  for (let i = 0; i < bullets.length; i += 1) {
    for (let j = i + 1; j < bullets.length; j += 1) {
      const hit = getBulletCollision(bullets[i], bullets[j], delta)
      if (hit != null) {
        const [p1, p2] = hit
        const c1 = info(bullets[i])
        const c2 = info(bullets[j])
        c1.any = true
        c2.any = true
        c1.rects.push({ x: p1.x, y: p1.y, width: 0, height: 0 })
        c2.rects.push({ x: p2.x, y: p2.y, width: 0, height: 0 })
        keepEarlier(bullets[i], c1, p1)
        keepEarlier(bullets[j], c2, p2)
      }
    }
  }
  // 对撞时子弹已经消失，截断本帧轨迹，免得后面还打中对撞点之后的坦克或砖
  for (const b of bullets) {
    const stop = infoMap.get(b.bulletId)?.stop
    if (stop != null) {
      b.x = stop.x
      b.y = stop.y
    }
  }

  // 3. 老鹰
  if (map.eagle != null && !map.eagleBroken) {
    const box = eagleRect(map.eagle)
    for (const b of bullets) {
      if (testCollide(box, bulletMBR(b))) {
        const c = info(b)
        c.any = true
        c.explode = true
        c.rects.push(box)
      }
    }
  }

  // 4. 砖 / 钢 / 边界
  for (const b of bullets) {
    const mbr = bulletMBR(b)
    const c = info(b)

    for (const t of map.brickIndicesIn(mbr)) {
      c.any = true
      c.explode = true
      c.hitBrick = true
      c.rects.push(map.brickRectAt(t))
    }
    for (const t of map.steelIndicesIn(mbr)) {
      c.any = true
      c.explode = true
      c.hitSteel = true
      c.rects.push(map.steelRectAt(t))
    }
    const border = borderCollisionRect(FIELD_SIZE)
    if (b.x <= 0 || b.x + BULLET_SIZE >= FIELD_SIZE || b.y <= 0 || b.y + BULLET_SIZE >= FIELD_SIZE) {
      c.any = true
      c.explode = true
      c.hitBorder = true
      c.rects.push(border)
    }
  }

  // 4b. 子弹 vs 坦克
  //   player→bot / player→player：命中并爆炸（结算扣血或冻结）
  //   bot→player：无头盔则命中并爆炸（玩家死亡）；有头盔则挡住子弹不伤人
  //   bot→bot：穿过，无效果
  for (const b of bullets) {
    const mbr = bulletMBR(b)
    const c = info(b)
    for (const tank of tanks) {
      if (!tank.alive || tank.tankId === b.tankId) {
        continue
      }
      if (!testCollide(tank.rect(), mbr, -0.02)) {
        continue
      }
      if (b.side === 'bot' && tank.side === 'bot') {
        continue // bot→bot：穿过
      }
      c.any = true
      if (tank.side === 'player' && tank.helmetDuration > 0) {
        break // 头盔挡弹（敌方和队友的都挡），子弹消失但不伤人、不爆炸
      }
      c.explode = true
      c.rects.push(tank.rect())
      hits.push({ bullet: b, target: tank })
      break
    }
  }

  // 5. 结算
  const guard = eagleGuard(map)
  const baseHitters: number[] = []
  for (const b of bullets) {
    const c = infoMap.get(b.bulletId)
    if (c == null || !c.any) {
      continue
    }
    b.dead = true

    if (!c.explode) {
      continue // 纯子弹对撞：直接消失
    }

    // 爆炸落点：贴着最近障碍
    const pos = explosionPosFromRects(b, c.rects)
    b.x = pos.x
    b.y = pos.y

    explosions.push(new Explosion({ x: b.x + 2, y: b.y + 2 }, 'small'))

    // 破坏地形（基于落点的 spread 范围）
    const spread = spreadBullet(b)
    const bricks = map.brickIndicesIn(spread)
    const hitsGuard =
      guard != null && bricks.some((t) => testCollide(guard, map.brickRectAt(t), -0.01))
    map.removeBricks(bricks)
    if (b.power >= STEEL_POWER) {
      map.removeSteels(map.steelIndicesIn(spread))
    }
    let hitsEagle = false
    if (map.eagle != null && !map.eagleBroken && testCollide(eagleRect(map.eagle), spread)) {
      map.destroyEagle()
      hitsEagle = true
    }
    if (b.side === 'bot' && (hitsGuard || hitsEagle)) {
      baseHitters.push(b.tankId)
    }

    // 音效（仅玩家子弹）
    if (b.side === 'player') {
      if (c.hitSteel || c.hitBorder) {
        audio.play('bullet_hit_1')
      } else if (c.hitBrick) {
        audio.play('bullet_hit_2')
      }
    }
  }

  // 6. 移除消亡子弹（in-place）
  let w = 0
  for (let r = 0; r < bullets.length; r += 1) {
    if (!bullets[r].dead) {
      bullets[w++] = bullets[r]
    }
  }
  bullets.length = w
  return baseHitters
}
