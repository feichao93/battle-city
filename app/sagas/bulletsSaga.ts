import { Map as IMap, Set as ISet } from 'immutable'
import { fork, put, select, take } from 'redux-saga/effects'
import { BLOCK_SIZE, BULLET_SIZE, FIELD_SIZE, ITEM_SIZE_MAP, N_MAP, STEEL_POWER } from 'utils/constants'
import { destroyBullets, destroyTanks } from 'sagas/common'
import { BulletRecord, BulletsMap, State } from 'types'
import { asBox, getDirectionInfo, iterRowsAndCols, testCollide, DefaultMap } from 'utils/common'
import { BulletCollisionInfo, getCollisionInfoBetweenBullets, getMBR, lastPos, spreadBullet } from 'utils/bullet-utils'

interface Context {
  /** 坦克被击中的统计 */
  readonly tankHitMap: DefaultMap<TankId, BulletRecord[]>
  /** 移动冻结的坦克tankId集合 */
  readonly frozenTankIdSet: Set<TankId>
  readonly bulletCollisionInfo: BulletCollisionInfo
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
        .set('lastX', bullet.x)
        .set('lastY', bullet.y) // 设置子弹上一次的位置, 用于进行碰撞检测
    })
    yield put({ type: 'UPDATE_BULLETS', updatedBullets })
  }
}

function* handleBulletsCollidedWithBricks(context: Context) {
  // todo 需要考虑子弹强度
  const { bullets, map: { bricks } }: State = yield select()

  bullets.forEach((b) => {
    const mbr = getMBR(asBox(b), asBox(lastPos(b)))
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.BRICK, mbr)) {
      const t = row * N_MAP.BRICK + col
      if (bricks.get(t)) {
        context.bulletCollisionInfo.get(b.bulletId).push({ type: 'brick', t })
      }
    }
  })
}

function* handleBulletsCollidedWithSteels({ bulletCollisionInfo }: Context) {
  // TODO 需要考虑子弹强度
  const { bullets, map: { steels } }: State = yield select()

  bullets.forEach((b) => {
    const mbr = getMBR(asBox(b), asBox(lastPos(b)))
    for (const [row, col] of iterRowsAndCols(ITEM_SIZE_MAP.STEEL, mbr)) {
      const t = row * N_MAP.STEEL + col
      if (steels.get(t)) {
        bulletCollisionInfo.get(b.bulletId).push({ type: 'steel', t })
      }
    }
  })
}

function* handleBulletsCollidedWithBorder({ bulletCollisionInfo }: Context) {
  const { bullets }: State = yield select()
  bullets.forEach((bullet) => {
    if (bullet.x <= 0) {
      bulletCollisionInfo.get(bullet.bulletId).push({ type: 'border', which: 'left' })
    }
    if (bullet.x + BULLET_SIZE >= FIELD_SIZE) {
      bulletCollisionInfo.get(bullet.bulletId).push({ type: 'border', which: 'right' })
    }
    if (bullet.y <= 0) {
      bulletCollisionInfo.get(bullet.bulletId).push({ type: 'border', which: 'up' })
    }
    if (bullet.y + BULLET_SIZE >= FIELD_SIZE) {
      bulletCollisionInfo.get(bullet.bulletId).push({ type: 'border', which: 'down' })
    }
  })
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
    // TODO 使用IndexHelper
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

function* destroyEagleIfNeeded(expBullets: BulletsMap) {
  const { map: { eagle } }: State = yield select()
  const eagleBox = asBox(eagle)
  for (const bullet of expBullets.values()) {
    const spreaded = spreadBullet(bullet)
    if (testCollide(eagleBox, spreaded)) {
      yield put<Action>({ type: 'DESTROY_EAGLE' })
      // DESTROY_EAGLE被dispatch之后将会触发游戏失败的流程
      return
    }
  }
}

function* handleBulletsCollidedWithTanks(context: Context) {
  const { bullets, tanks: allTanks }: State = yield select()
  const activeTanks = allTanks.filter(t => t.active)

  // 子弹与坦克碰撞的规则
  // 1. player的子弹打到player-tank: player-tank将会停滞一段时间
  // 2. player的子弹打到AI-tank: AI-tank扣血
  // 3. AI的子弹打到player-tank: player-tank扣血/死亡
  // 4. AI的子弹达到AI-tank: 不发生任何事件
  for (const bullet of bullets.values()) {
    for (const tank of activeTanks.values()) {
      if (tank.tankId === bullet.tankId) {
        // 如果是自己发射的子弹, 则不需要进行处理
        continue
      }
      const subject = asBox(tank)
      const mbr = getMBR(asBox(lastPos(bullet)), asBox(bullet))
      if (testCollide(subject, mbr, -0.02)) {
        const bulletSide = allTanks.find(t => (t.tankId === bullet.tankId)).side
        const tankSide = tank.side
        const infoRow = context.bulletCollisionInfo.get(bullet.bulletId)

        if (bulletSide === 'human' && tankSide === 'human') {
          infoRow.push({ type: 'tank', tank, shouldExplode: true })
          context.frozenTankIdSet.add(tank.tankId)
        } else if (bulletSide === 'human' && tankSide === 'ai') {
          context.tankHitMap.get(tank.tankId).push(bullet)
          infoRow.push({ type: 'tank', tank, shouldExplode: true })
        } else if (bulletSide === 'ai' && tankSide === 'human') {
          if (tank.helmetDuration > 0) {
            infoRow.push({ type: 'tank', tank, shouldExplode: false })
          } else {
            context.tankHitMap.get(tank.tankId).push(bullet)
            infoRow.push({ type: 'tank', tank, shouldExplode: true })
          }
        } else if (bulletSide === 'ai' && tankSide === 'ai') {
          // 子弹穿过坦克
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
    for (const other of bullets.values()) {
      if (bullet.bulletId <= other.bulletId) {
        continue
      }
      const collisionInfo = getCollisionInfoBetweenBullets(bullet, other)
      if (collisionInfo) {
        const [info1, info2] = collisionInfo
        context.bulletCollisionInfo.get(bullet.bulletId).push(info1)
        context.bulletCollisionInfo.get(other.bulletId).push(info2)
      }
    }
  }
}

function* handleBulletsCollidedWithEagle({ bulletCollisionInfo }: Context) {
  const { bullets, map: { eagle } }: State = yield select()
  if (eagle == null || eagle.broken) {
    // 如果Eagle尚未加载, 或是已经被破坏, 那么直接返回
    return
  }
  const eagleBox = asBox(eagle)
  for (const bullet of bullets.values()) {
    const mbr = getMBR(asBox(bullet), asBox(lastPos(bullet)))
    if (testCollide(eagleBox, mbr)) {
      bulletCollisionInfo.get(bullet.bulletId).push({ type: 'eagle', eagle })
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

    // 新建一个统计对象(context), 用来存放这一个tick中的统计信息
    // 注意这里的Set是ES2015的原生Set
    const context: Context = {
      tankHitMap: new DefaultMap(() => []),
      frozenTankIdSet: new Set(),
      bulletCollisionInfo: new BulletCollisionInfo(bullets),
    }

    // TODO 下面这些generator改成普通的函数调用
    yield* handleBulletsCollidedWithEagle(context)
    yield* handleBulletsCollidedWithTanks(context)
    yield* handleBulletsCollidedWithBullets(context)
    yield* handleBulletsCollidedWithBricks(context)
    yield* handleBulletsCollidedWithSteels(context)
    yield* handleBulletsCollidedWithBorder(context)

    const { expBullets, noExpBullets } = context.bulletCollisionInfo.getExplosionInfo()

    // 产生爆炸效果, 并移除子弹
    yield fork(destroyBullets, expBullets, true)
    // 不产生爆炸, 直接消失的子弹
    yield fork(destroyBullets, noExpBullets, false)

    if (!expBullets.isEmpty()) {
      // 只有产生爆炸效果的子弹才会破坏附近的brickWall/steelWall/eagle
      yield* destroyEagleIfNeeded(expBullets)
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
    // stageSaga中take KILL的逻辑, 依赖于"REMOVE_TANK已经被处理"
    yield fork(destroyTanks, IMap(kills.map(kill =>
      [kill.targetTank.tankId, kill.targetTank]
    )))
    yield* kills.map(killAction => put(killAction))
  }
}

export default function* bulletsSaga() {
  yield fork(handleTick)
  yield fork(handleAfterTick)
}
