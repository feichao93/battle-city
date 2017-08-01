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
import { BulletRecord, BulletsMap, State, TankRecord } from 'types'

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
    yield put({
      type: 'DESTROY_STEELS',
      ts: ISet(steelsNeedToDestroy),
    })
  }
}

function* destroyTanks(tankIdSet: ISet<TankId>) {
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
    yield put({
      type: 'DESTROY_BRICKS',
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
  const { bullets, tanks }: State = yield select()

  // 子弹与坦克碰撞的规则
  // 1. player的子弹打到player-tank: player-tank将会停滞若干时间
  // 2. player的子弹打到AI-tank: AI-tank扣血
  // 3. AI的子弹打到player-tank: player-tank扣血/死亡
  // 4. AI的子弹达到AI-tank: 不发生任何事件
  for (const bullet of bullets.values()) {
    for (const tank of tanks.values()) {
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
        const bulletSide = tanks.find(t => (t.tankId === bullet.tankId)).side
        const tankSide = tank.side

        if (bulletSide === 'human' && tankSide === 'human') {
          // todo 暂时对坦克不进行处理
          // 不发生子弹爆炸
          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === 'human' && tankSide === 'ai') {
          const hurtSubMap = getOrDefault(context.tankHurtMap, tank.tankId, () => new Map())
          const oldHurt = hurtSubMap.get(tank.tankId) || 0
          hurtSubMap.set(bullet.tankId, oldHurt + 1)

          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === 'ai' && tankSide === 'human') {
          const hurtSubMap = getOrDefault(context.tankHurtMap, tank.tankId, () => new Map())
          const oldHurt = hurtSubMap.get(tank.tankId) || 0
          hurtSubMap.set(bullet.tankId, oldHurt + 1)

          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === 'ai' && tankSide === 'ai') {
          // 坦克什么事也不发生
          context.noExpBulletIdSet.add(bullet.bulletId)
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
    const { bullets, players, tanks }: State = yield select()

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

    const kills: PutEffect<Action.KillAction>[] = []
    // 坦克伤害结算 todo 假设目前tank被击中之后将直接爆炸
    for (const [targetTankId, hurtMap] of context.tankHurtMap.entries()) {
      // todo 目前不考虑具体的伤害值, 认为一旦承受伤害, tank就会死亡
      // const totalHurt = sum(hurtMap.values())
      const sourceTankId = hurtMap.values().next().value
      kills.push(put<Action.KillAction>({
        type: 'KILL',
        targetTank: tanks.get(targetTankId),
        sourceTank: tanks.get(sourceTankId),
        targetPlayer: players.find(ply => ply.tankId === targetTankId),
        sourcePlayer: players.find(ply => ply.tankId === sourceTankId),
      }))
    }
    // 移除坦克 & 产生爆炸效果
    if (context.tankHurtMap.size > 0) {
      yield destroyTanks(ISet(context.tankHurtMap.keys()))
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
      const { bullets, spawnExplosion } = yield take('DESTROY_BULLETS')
      if (spawnExplosion) {
        yield* bullets.toArray().map(makeExplosionFromBullet)
      }
    }
  })
}
