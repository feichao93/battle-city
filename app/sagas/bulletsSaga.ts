import { Map as IMap, Set as ISet } from 'immutable'
import { fork, put, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE, ITEM_SIZE_MAP, N_MAP, STEEL_POWER } from 'utils/constants'
import { destroyBullets, destroyTanks } from 'sagas/common'
import { BulletRecord, BulletsMap, State } from 'types'
import { asBox, getDirectionInfo, getOrDefault, isInField, iterRowsAndCols, testCollide } from 'utils/common'

interface Context {
  /** 将要爆炸的子弹的id集合 */
  readonly expBulletIdSet: Set<BulletId>,
  /** 不需要爆炸的子弹的id集合 */
  readonly noExpBulletIdSet: Set<BulletId>,
  /** 坦克被击中的统计 */
  readonly tankHitMap: Map<TankId, BulletRecord[]>
  /** 移动冻结的坦克tankId集合 */
  readonly frozenTankIdSet: Set<TankId>
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
  // todo 需要考虑子弹强度
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
  // todo 需要考虑子弹强度
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

function* destroyBricks(collidedBullets: BulletsMap) {
  const { map: { bricks } }: State = yield select()
  const bricksNeedToDestroy: BrickIndex[] = []

  collidedBullets.forEach((bullet) => {
    // TODO spreadBullet的时候 根据bullet.power的不同会影响spread的范围
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
  const { map: { eagle } }: State = yield select()
  if (eagle == null) {
    return bullets.clear()
  }
  const { broken, x, y } = eagle
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
          getOrDefault(context.tankHitMap, tank.tankId, () => [])
            .push(bullet)
          context.expBulletIdSet.add(bullet.bulletId)
        } else if (bulletSide === 'ai' && tankSide === 'human') {
          if (tank.helmetDuration > 0) {
            context.noExpBulletIdSet.add(bullet.bulletId)
          } else {
            getOrDefault(context.tankHitMap, tank.tankId, () => [])
              .push(bullet)
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

function calculateHurtsAndKillsFromContext({ tanks, players }: State, context: Context) {
  const kills: Action.KillAction[] = []
  const hurts: Action.HurtAction[] = []

  for (const [targetTankId, hitBullets] of context.tankHitMap.entries()) {
    const hurt = hitBullets.length
    const targetTank = tanks.get(targetTankId)
    if (hurt >= targetTank.hp) {
      // 击杀了目标坦克
      const sourceTankId = hitBullets[0].tankId
      const sourcePlayerName = hitBullets[0].playerName
      kills.push({
        type: 'KILL',
        targetTank,
        sourceTank: tanks.get(sourceTankId),
        targetPlayer: players.find(p => p.activeTankId === targetTankId),
        sourcePlayer: players.get(sourcePlayerName),
      })
    } else {
      hurts.push({
        type: 'HURT',
        targetTank,
        hurt,
      })
    }
  }

  return { kills, hurts }
}

function* handleAfterTick() {
  while (true) {
    yield take('AFTER_TICK')
    const state: State = yield select()
    const { bullets, players, tanks: allTanks } = state
    const activeTanks = allTanks.filter(t => t.active)

    const bulletsCollidedWithEagle = yield* filterBulletsCollidedWithEagle(bullets)
    if (!bulletsCollidedWithEagle.isEmpty()) {
      yield fork(destroyBullets, bulletsCollidedWithEagle, true)
      yield put({ type: 'DESTROY_EAGLE' })
      // DESTROY_EAGLE被dispatch之后将会触发游戏失败的流程
    }

    // 新建一个统计对象(context), 用来存放这一个tick中的统计信息
    // 注意这里的Set是ES2015的原生Set
    const context: Context = {
      expBulletIdSet: new Set(),
      noExpBulletIdSet: new Set(),
      tankHitMap: new Map(),
      frozenTankIdSet: new Set(),
    }

    yield* handleBulletsCollidedWithTanks(context)
    yield* handleBulletsCollidedWithBullets(context)
    yield* handleBulletsCollidedWithBricks(context)
    yield* handleBulletsCollidedWithSteels(context)

    // 产生爆炸效果的的子弹
    const expBullets = bullets.filter(bullet => context.expBulletIdSet.has(bullet.bulletId))
    if (!expBullets.isEmpty()) {
      yield fork(destroyBullets, expBullets, true)

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

    const { kills, hurts } = calculateHurtsAndKillsFromContext(state, context)

    yield* hurts.map(hurtAction => put(hurtAction))
    // 注意 必须先fork destroyTanks, 然后再put killAction
    // stageSaga中take KILL的逻辑, 依赖于REMOVE_TANK已经被处理
    yield fork(destroyTanks, IMap(kills.map(kill =>
      [kill.targetTank.tankId, kill.targetTank]
    )))
    yield* kills.map(killAction => put(killAction))

    // 不产生爆炸, 直接消失的子弹
    const noExpBullets = bullets.filter(bullet => context.noExpBulletIdSet.has(bullet.bulletId))
    yield fork(destroyBullets, noExpBullets, false)

    // 移除在边界外面的子弹
    const outsideBullets = bullets.filterNot(bullet => isInField(asBox(bullet)))
    yield fork(destroyBullets, outsideBullets, true)
  }
}

export default function* bulletsSaga() {
  yield fork(handleTick)
  yield fork(handleAfterTick)
}
