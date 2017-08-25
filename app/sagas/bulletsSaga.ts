import { Map as IMap, Set as ISet } from 'immutable'
import { fork, put, PutEffect, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE, ITEM_SIZE_MAP, N_MAP, STEEL_POWER } from 'utils/constants'
import {
  asBox,
  getDirectionInfo,
  getNextId,
  isInField,
  iterRowsAndCols,
  testCollide
} from 'utils/common'
import { BulletRecord, BulletsMap, State, TankRecord, ScoreRecord } from 'types'

type HurtCount = number
type TargetTankId = TankId
type SourceTankId = TankId

type Context = {
  /** 将要爆炸的子弹的id集合 */
  expBulletIdSet: Set<BulletId>,
  /** 不需要爆炸的子弹的id集合 */
  noExpBulletIdSet: Set<BulletId>,
  /** 坦克受伤统计Map */
  tankHurtMap: Map<TargetTankId, Map<SourceTankId, HurtCount>>
  /** 移动冻结的坦克tankId集合 */
  frozenTankIdSet: Set<TankId>
}

function isBulletInField(bullet: BulletRecord) {
  return isInField(asBox(bullet))
}

function sum(iterable: Iterable<number>) {
  let result = 0
  for (const item of iterable) {
    result += item
  }
  return result
}

function getOrDefault<K, V>(map: Map<K, V>, key: K, getValue: () => V) {
  if (!map.has(key)) {
    map.set(key, getValue())
  }
  return map.get(key)
}

function makeExplosionFromBullet(bullet: BulletRecord): PutEffect<Action> {
  return put({
    type: 'SPAWN_EXPLOSION',
    x: bullet.x - 6,
    y: bullet.y - 6,
    explosionType: 'bullet',
    explosionId: getNextId('explosion'),
  } as Action.SpawnExplosionAction)
}

function makeScoreFromTank(tank: TankRecord): PutEffect<Action> {
  const scoreMap = {
    basic: 100,
    fast: 200,
    power: 300,
    armor: 400,
  }
  return put({
    type: 'ADD_SCORE',
    score: ScoreRecord({
      score: scoreMap[tank.level],
      scoreId: getNextId('score'),
      // todo 调整score位置
      x: tank.x + 12,
      y: tank.y - 12,
    }),
  } as Action.AddScoreAction)
}

function makeExplosionFromTank(tank: TankRecord): PutEffect<Action> {
  return put({
    type: 'SPAWN_EXPLOSION',
    x: tank.x - 6,
    y: tank.y - 6,
    explosionType: 'tank',
    explosionId: getNextId('explosion'),
  } as Action.SpawnExplosionAction)
}

function* handleTick() {
  while (true) {
    const { delta }: Action.TickAction = yield take('TICK')
    const { bullets }: State = yield select()
    if (bullets.isEmpty()) {
      continue
    }
    const updatedBullets = bullets.map((bullet) => {
      const { direction, speed } = bullet
      const distance = speed * delta
      const { xy, updater } = getDirectionInfo(direction)
      return bullet.update(xy, updater(distance))
    })
    yield put({ type: 'UPDATE_BULLETS', updatedBullets })
  }
}

function* handleBulletsCollidedWithBricks(context: Context) {
  const { bullets, map: { bricks } }: State = yield select()

  bullets.forEach((bullet) => {
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.BRICK, asBox(bullet))) {
      const t = row * N_MAP.BRICK + col
      if (bricks.get(t)) {
        context.expBulletIdSet.add(bullet.bulletId)
        return
      }
    }
  })
}

function* handleBulletsCollidedWithSteels(context: Context) {
  const { bullets, map: { steels } }: State = yield select()

  bullets.forEach((bullet) => {
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.STEEL, asBox(bullet))) {
      const t = row * N_MAP.STEEL + col
      if (steels.get(t)) {
        context.expBulletIdSet.add(bullet.bulletId)
        return
      }
    }
  })
}

const BULLET_EXPLOSION_SPREAD = 4
function spreadBullet(bullet: BulletRecord) {
  const object = asBox(bullet)
  if (bullet.direction === 'up' || bullet.direction === 'down') {
    object.x -= BULLET_EXPLOSION_SPREAD
    object.width += 2 * BULLET_EXPLOSION_SPREAD
  } else {
    object.y -= BULLET_EXPLOSION_SPREAD
    object.height += 2 * BULLET_EXPLOSION_SPREAD
  }
  return object
}

function* destroySteels(collidedBullets: BulletsMap) {
  const { map: { steels } }: State = yield select()
  const steelsNeedToDestroy: SteelIndex[] = []
  collidedBullets.forEach((bullet) => {
    if (bullet.power >= STEEL_POWER) {
      for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.STEEL, spreadBullet(bullet))) {
        const t = row * N_MAP.STEEL + col
        if (steels.get(t)) {
          steelsNeedToDestroy.push(t)
        }
      }
    }
  })

  if (steelsNeedToDestroy.length > 0) {
    yield put<Action.RemoveSteelsAction>({
      type: 'REMOVE_STEELS',
      ts: ISet(steelsNeedToDestroy),
    })
  }
}

/** 从地图上移除坦克, 并产生坦克爆炸效果 */
export function* destroyTanks(tankIdSet: ISet<TankId>) {
  const { tanks }: State = yield select()
  // 移除tank
  yield* tankIdSet.map(tankId => put({
    type: 'REMOVE_TANK',
    tankId,
  }))
  // 产生坦克爆炸效果
  yield* tankIdSet.map(tankId => tanks.get(tankId))
    .map(makeExplosionFromTank)
}

function* destroyBricks(collidedBullets: BulletsMap) {
  const { map: { bricks } }: State = yield select()
  const bricksNeedToDestroy: BrickIndex[] = []

  collidedBullets.forEach((bullet) => {
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.BRICK, spreadBullet(bullet))) {
      const t = row * N_MAP.BRICK + col
      if (bricks.get(t)) {
        bricksNeedToDestroy.push(t)
      }
    }
  })

  if (bricksNeedToDestroy.length > 0) {
    yield put<Action.RemoveBricksAction>({
      type: 'REMOVE_BRICKS',
      ts: ISet(bricksNeedToDestroy),
    })
  }
}

function* filterBulletsCollidedWithEagle(bullets: BulletsMap) {
  // 判断是否和eagle相撞
  const { map: { eagle: { broken, x, y } } }: State = yield select()
  if (broken) {
    return IMap()
  } else {
    const eagleBox = {
      x,
      y,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
    }
    return bullets.filter(bullet => testCollide(eagleBox, asBox(bullet)))
  }
}

function* handleBulletsCollidedWithTanks(context: Context) {
  const { bullets, tanks: allTanks }: State = yield select()
  const activeTanks = allTanks.filter(t => t.active)

  // 子弹与坦克碰撞的规则
  // 1. player的子弹打到player-tank: player-tank将会停滞若干时间
  // 2. player的子弹打到AI-tank: AI-tank扣血
  // 3. AI的子弹打到player-tank: player-tank扣血/死亡
  // 4. AI的子弹达到AI-tank: 不发生任何事件
  for (const bullet of bullets.values()) {
    for (const tank of activeTanks.values()) {
      if (tank.tankId === bullet.tankId) {
        // 如果是自己发射的子弹, 则不需要进行处理
        continue
      }
      const subject = {
        x: tank.x,
        y: tank.y,
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
      }
      if (testCollide(subject, asBox(bullet), -0.02)) {
        const bulletSide = allTanks.find(t => (t.tankId === bullet.tankId)).side
        const tankSide = tank.side

        if (bulletSide === 'human' && tankSide === 'human') {
          context.expBulletIdSet.add(bullet.bulletId)
          context.frozenTankIdSet.add(tank.tankId)
        } else if (bulletSide === 'human' && tankSide === 'ai') {
          const hurtSubMap = getOrDefault(context.tankHurtMap, tank.tankId, () => new Map())
          const oldHurt = hurtSubMap.get(tank.tankId) || 0
          hurtSubMap.set(bullet.tankId, oldHurt + 1)

          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === 'ai' && tankSide === 'human') {
          if (tank.helmetDuration > 0) {
            context.noExpBulletIdSet.add(bullet.bulletId)
          } else {
            const hurtSubMap = getOrDefault(context.tankHurtMap, tank.tankId, () => new Map())
            const oldHurt = hurtSubMap.get(tank.tankId) || 0
            hurtSubMap.set(bullet.tankId, oldHurt + 1)
            context.expBulletIdSet.add(bullet.bulletId)
          }
        } else if (bulletSide === 'ai' && tankSide === 'ai') {
          // 子弹会穿过坦克
          // context.noExpBulletIdSet.add(bullet.bulletId)
        } else {
          throw new Error('Error side status')
        }
      }
    }
  }
}

function* handleBulletsCollidedWithBullets(context: Context) {
  const { bullets }: State = yield select()
  for (const bullet of bullets.values()) {
    const subject = asBox(bullet)
    for (const other of bullets.values()) {
      if (bullet.bulletId === other.bulletId) {
        continue
      }
      const object = asBox(other)
      if (testCollide(subject, object)) {
        context.noExpBulletIdSet.add(bullet.bulletId)
      }
    }
  }
}

function* handleAfterTick() {
  while (true) {
    yield take('AFTER_TICK')
    const { bullets, players, tanks: allTanks }: State = yield select()
    const activeTanks = allTanks.filter(t => t.active)

    const bulletsCollidedWithEagle = yield* filterBulletsCollidedWithEagle(bullets)
    if (!bulletsCollidedWithEagle.isEmpty()) {
      yield put({
        type: 'DESTROY_BULLETS',
        bullets: bulletsCollidedWithEagle,
        spawnExplosion: true,
      })
      yield put({ type: 'DESTROY_EAGLE' })
      // DESTROY_EAGLE被dispatch之后将会触发游戏失败的流程
    }

    // 新建一个统计对象(context), 用来存放这一个tick中的统计信息
    // 注意这里的Set是ES2015的原生Set
    const context: Context = {
      expBulletIdSet: new Set(),
      noExpBulletIdSet: new Set(),
      tankHurtMap: new Map(),
      frozenTankIdSet: new Set(),
    }

    yield* handleBulletsCollidedWithTanks(context)
    yield* handleBulletsCollidedWithBullets(context)
    yield* handleBulletsCollidedWithBricks(context)
    yield* handleBulletsCollidedWithSteels(context)

    // 产生爆炸效果的的子弹
    const expBullets = bullets.filter(bullet => context.expBulletIdSet.has(bullet.bulletId))
    if (!expBullets.isEmpty()) {
      yield put({
        type: 'DESTROY_BULLETS',
        bullets: expBullets,
        spawnExplosion: true,
      })

      // 产生爆炸效果的子弹才会破坏附近的brickWall和steelWall
      yield* destroyBricks(expBullets)
      yield* destroySteels(expBullets)
    }

    // 更新被友军击中的坦克的frozenTimeout
    for (const tankId of context.frozenTankIdSet) {
      yield put<Action.SetFrozenTimeoutAction>({
        type: 'SET_FROZEN_TIMEOUT',
        tankId,
        frozenTimeout: 500,
      })
    }

    const kills: PutEffect<Action.KillAction>[] = []
    const destroyedTankIdSet = new Set<TargetTankId>()
    // 坦克伤害结算
    for (const [targetTankId, hurtMap] of context.tankHurtMap.entries()) {
      const hurt = sum(hurtMap.values())
      const targetTank = activeTanks.get(targetTankId)
      if (hurt >= targetTank.hp) {
        // 击杀了目标坦克
        const sourceTankId = hurtMap.keys().next().value
        kills.push(put<Action.KillAction>({
          type: 'KILL',
          targetTank,
          // 注意这里用allTanks, 因为sourceTank在这个时候可能已经挂了
          sourceTank: allTanks.get(sourceTankId),
          targetPlayer: players.find(p => p.activeTankId === targetTankId),
          sourcePlayer: players.find(p => p.activeTankId === sourceTankId),
        }))
        destroyedTankIdSet.add(targetTankId)
      } else {
        yield put<Action>({ type: 'HURT', targetTank, hurt })
      }
    }
    if (destroyedTankIdSet.size > 0) {
      // 移除坦克 & 产生爆炸效果
      yield* destroyTanks(ISet(destroyedTankIdSet))

      // 显示击杀得分
      const destroyedAITanks = ISet(destroyedTankIdSet)
        .map(tankId => allTanks.get(tankId))
        .filter(tank => tank.side === 'ai')
      if (destroyedAITanks.size > 0) {
        yield* destroyedAITanks.map(makeScoreFromTank)
      }
    }
    // notice KillAction是在destroyTanks之后被dispatch的; 此时地图上的坦克已经被去除了
    yield* kills

    // 不产生爆炸, 直接消失的子弹
    const noExpBullets = bullets.filter(bullet => context.noExpBulletIdSet.has(bullet.bulletId))
    if (context.noExpBulletIdSet.size > 0) {
      yield put({
        type: 'DESTROY_BULLETS',
        bullets: noExpBullets,
        spawnExplosion: false,
      })
    }

    // 移除在边界外面的子弹
    const outsideBullets = bullets.filterNot(isBulletInField)
    if (!outsideBullets.isEmpty()) {
      yield put({
        type: 'DESTROY_BULLETS',
        bullets: outsideBullets,
        spawnExplosion: true,
      })
    }
  }
}

export default function* bulletsSaga() {
  yield fork(handleTick)
  yield fork(handleAfterTick)

  yield fork(function* handleDestroyBullets() {
    while (true) {
      const { bullets, spawnExplosion }: Action.DestroyBulletsAction = yield take('DESTROY_BULLETS')
      if (spawnExplosion) {
        yield* bullets.map(makeExplosionFromBullet).values()
      }
    }
  })
}
