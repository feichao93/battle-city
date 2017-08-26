webpackJsonp([0],{

/***/ 149:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(12);
const common_1 = __webpack_require__(8);
const canTankMove_1 = __webpack_require__(337);
const selectors = __webpack_require__(33);
function* directionController(playerName, getPlayerInput) {
    while (true) {
        const { delta } = yield effects_1.take('TICK');
        const input = yield* getPlayerInput(delta);
        const tank = yield effects_1.select(selectors.playerTank, playerName);
        const { game: { AIFrozenTimeout } } = yield effects_1.select();
        if (tank == null
            || tank.frozenTimeout > 0
            || tank.side === 'ai' && AIFrozenTimeout > 0) {
            continue;
        }
        let nextFrozenTimeout = tank.frozenTimeout <= 0 ? 0 : tank.frozenTimeout - delta;
        if (input == null) {
            if (tank.moving) {
                yield effects_1.put({ type: 'STOP_MOVE', tankId: tank.tankId });
            }
        }
        else if (input.type === 'turn') {
            const { direction } = input;
            // 坦克进行转向时, 需要对坐标进行处理
            // 如果转向UP/DOWN, 则将x坐标转换到最近的8的倍数
            // 如果转向为LEFT/RIGHT, 则将y坐标设置为最近的8的倍数
            // 这样做是为了使坦克转向之后更容易的向前行驶, 因为障碍物(brick/steel/river)的坐标也总是4或8的倍数
            // 但是有的时候简单的使用Math.round来转换坐标, 可能使得坦克卡在障碍物中
            // 所以这里转向的时候, 需要同时尝试Math.floor和Math.ceil来转换坐标
            const turned = tank.set('direction', direction); // 转向之后的tank对象
            // 要进行校准的坐标字段
            const { xy } = common_1.getDirectionInfo(direction, true);
            const n = tank.get(xy) / 8;
            const useFloor = turned.set(xy, Math.floor(n) * 8);
            const useCeil = turned.set(xy, Math.ceil(n) * 8);
            const canMoveWhenUseFloor = yield effects_1.select(canTankMove_1.default, useFloor);
            const canMoveWhenUseCeil = yield effects_1.select(canTankMove_1.default, useCeil);
            let movedTank;
            if (!canMoveWhenUseFloor) {
                movedTank = useCeil;
            }
            else if (!canMoveWhenUseCeil) {
                movedTank = useFloor;
            }
            else {
                movedTank = turned.set(xy, Math.round(n) * 8);
            }
            yield effects_1.put({
                type: 'MOVE',
                tankId: tank.tankId,
                tank: movedTank,
            });
        }
        else if (input.type === 'forward') {
            const speed = common_1.getTankMoveSpeed(tank);
            const distance = Math.min(delta * speed, input.maxDistance || Infinity);
            const { xy, updater } = common_1.getDirectionInfo(tank.direction);
            const movedTank = tank.update(xy, updater(distance));
            if (yield effects_1.select(canTankMove_1.default, movedTank)) {
                yield effects_1.put({
                    type: 'MOVE',
                    tankId: tank.tankId,
                    tank: movedTank,
                });
                if (!tank.moving) {
                    yield effects_1.put({ type: 'START_MOVE', tankId: tank.tankId });
                }
            }
        }
        else {
            throw new Error(`Invalid input: ${input}`);
        }
        if (tank.frozenTimeout !== nextFrozenTimeout) {
            yield effects_1.put({
                type: 'SET_FROZEN_TIMEOUT',
                tankId: tank.tankId,
                frozenTimeout: nextFrozenTimeout,
            });
        }
    }
}
exports.default = directionController;


/***/ }),

/***/ 150:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(12);
const common_1 = __webpack_require__(8);
const selectors = __webpack_require__(33);
const types_1 = __webpack_require__(9);
function* fireController(playerName, shouldFire) {
    // tank.cooldown用来记录player距离下一次可以发射子弹的时间
    // tank.cooldown大于0的时候玩家不能发射子弹
    // 每个TICK时, cooldown都会相应减少. 坦克发射子弹的时候, cooldown重置为坦克的发射间隔
    // tank.cooldown和bulletLimit共同影响坦克能否发射子弹
    while (true) {
        const { delta } = yield effects_1.take('TICK');
        const { bullets: allBullets } = yield effects_1.select();
        const tank = yield effects_1.select(selectors.playerTank, playerName);
        const { game: { AIFrozenTimeout } } = yield effects_1.select();
        if (tank == null || tank.side === 'ai' && AIFrozenTimeout > 0) {
            continue;
        }
        let nextCooldown = tank.cooldown <= 0 ? 0 : tank.cooldown - delta;
        if (tank.cooldown <= 0 && shouldFire()) {
            const bullets = allBullets.filter(bullet => (bullet.tankId === tank.tankId));
            if (bullets.count() < common_1.getTankBulletLimit(tank)) {
                const { x, y } = common_1.calculateBulletStartPosition(tank);
                yield effects_1.put({
                    type: 'ADD_BULLET',
                    bullet: types_1.BulletRecord({
                        bulletId: common_1.getNextId('bullet'),
                        direction: tank.direction,
                        x,
                        y,
                        power: common_1.getTankBulletPower(tank),
                        speed: common_1.getTankBulletSpeed(tank),
                        tankId: tank.tankId,
                    }),
                });
                // 一旦发射子弹, 则重置cooldown计数器
                nextCooldown = common_1.getTankBulletInterval(tank);
            } // else 如果坦克发射的子弹已经到达上限, 则坦克不能继续发射子弹
        }
        if (tank.cooldown !== nextCooldown) {
            yield effects_1.put({
                type: 'SET_COOLDOWN',
                tankId: tank.tankId,
                cooldown: nextCooldown,
            });
        }
    }
}
exports.default = fireController;


/***/ }),

/***/ 151:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(5);
const effects_1 = __webpack_require__(12);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(8);
const types_1 = __webpack_require__(9);
function isBulletInField(bullet) {
    return common_1.isInField(common_1.asBox(bullet));
}
function sum(iterable) {
    let result = 0;
    for (const item of iterable) {
        result += item;
    }
    return result;
}
function getOrDefault(map, key, getValue) {
    if (!map.has(key)) {
        map.set(key, getValue());
    }
    return map.get(key);
}
function makeExplosionFromBullet(bullet) {
    return effects_1.put({
        type: 'SPAWN_EXPLOSION',
        x: bullet.x - 6,
        y: bullet.y - 6,
        explosionType: 'bullet',
        explosionId: common_1.getNextId('explosion'),
    });
}
function makeScoreFromTank(tank) {
    const scoreMap = {
        basic: 100,
        fast: 200,
        power: 300,
        armor: 400,
    };
    return effects_1.put({
        type: 'ADD_SCORE',
        score: types_1.ScoreRecord({
            score: scoreMap[tank.level],
            scoreId: common_1.getNextId('score'),
            // todo 调整score位置
            x: tank.x + 12,
            y: tank.y - 12,
        }),
    });
}
function makeExplosionFromTank(tank) {
    return effects_1.put({
        type: 'SPAWN_EXPLOSION',
        x: tank.x - 6,
        y: tank.y - 6,
        explosionType: 'tank',
        explosionId: common_1.getNextId('explosion'),
    });
}
function* handleTick() {
    while (true) {
        const { delta } = yield effects_1.take('TICK');
        const { bullets } = yield effects_1.select();
        if (bullets.isEmpty()) {
            continue;
        }
        const updatedBullets = bullets.map((bullet) => {
            const { direction, speed } = bullet;
            const distance = speed * delta;
            const { xy, updater } = common_1.getDirectionInfo(direction);
            return bullet.update(xy, updater(distance));
        });
        yield effects_1.put({ type: 'UPDATE_BULLETS', updatedBullets });
    }
}
function* handleBulletsCollidedWithBricks(context) {
    // todo 需要考虑子弹强度
    const { bullets, map: { bricks } } = yield effects_1.select();
    bullets.forEach((bullet) => {
        for (const [row, col] of common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, common_1.asBox(bullet))) {
            const t = row * constants_1.N_MAP.BRICK + col;
            if (bricks.get(t)) {
                context.expBulletIdSet.add(bullet.bulletId);
                return;
            }
        }
    });
}
function* handleBulletsCollidedWithSteels(context) {
    // todo 需要考虑子弹强度
    const { bullets, map: { steels } } = yield effects_1.select();
    bullets.forEach((bullet) => {
        for (const [row, col] of common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.STEEL, common_1.asBox(bullet))) {
            const t = row * constants_1.N_MAP.STEEL + col;
            if (steels.get(t)) {
                context.expBulletIdSet.add(bullet.bulletId);
                return;
            }
        }
    });
}
const BULLET_EXPLOSION_SPREAD = 4;
function spreadBullet(bullet) {
    const object = common_1.asBox(bullet);
    if (bullet.direction === 'up' || bullet.direction === 'down') {
        object.x -= BULLET_EXPLOSION_SPREAD;
        object.width += 2 * BULLET_EXPLOSION_SPREAD;
    }
    else {
        object.y -= BULLET_EXPLOSION_SPREAD;
        object.height += 2 * BULLET_EXPLOSION_SPREAD;
    }
    return object;
}
function* destroySteels(collidedBullets) {
    const { map: { steels } } = yield effects_1.select();
    const steelsNeedToDestroy = [];
    collidedBullets.forEach((bullet) => {
        if (bullet.power >= constants_1.STEEL_POWER) {
            for (const [row, col] of common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.STEEL, spreadBullet(bullet))) {
                const t = row * constants_1.N_MAP.STEEL + col;
                if (steels.get(t)) {
                    steelsNeedToDestroy.push(t);
                }
            }
        }
    });
    if (steelsNeedToDestroy.length > 0) {
        yield effects_1.put({
            type: 'REMOVE_STEELS',
            ts: immutable_1.Set(steelsNeedToDestroy),
        });
    }
}
/** 从地图上移除坦克, 并产生坦克爆炸效果 */
function* destroyTanks(tankIdSet) {
    const { tanks } = yield effects_1.select();
    // 移除tank
    yield* tankIdSet.map(tankId => effects_1.put({
        type: 'REMOVE_TANK',
        tankId,
    }));
    // 产生坦克爆炸效果
    yield* tankIdSet.map(tankId => tanks.get(tankId))
        .map(makeExplosionFromTank);
}
exports.destroyTanks = destroyTanks;
function* destroyBricks(collidedBullets) {
    const { map: { bricks } } = yield effects_1.select();
    const bricksNeedToDestroy = [];
    collidedBullets.forEach((bullet) => {
        for (const [row, col] of common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, spreadBullet(bullet))) {
            const t = row * constants_1.N_MAP.BRICK + col;
            if (bricks.get(t)) {
                bricksNeedToDestroy.push(t);
            }
        }
    });
    if (bricksNeedToDestroy.length > 0) {
        yield effects_1.put({
            type: 'REMOVE_BRICKS',
            ts: immutable_1.Set(bricksNeedToDestroy),
        });
    }
}
function* filterBulletsCollidedWithEagle(bullets) {
    // 判断是否和eagle相撞
    const { map: { eagle: { broken, x, y } } } = yield effects_1.select();
    if (broken) {
        return immutable_1.Map();
    }
    else {
        const eagleBox = {
            x,
            y,
            width: constants_1.BLOCK_SIZE,
            height: constants_1.BLOCK_SIZE,
        };
        return bullets.filter(bullet => common_1.testCollide(eagleBox, common_1.asBox(bullet)));
    }
}
function* handleBulletsCollidedWithTanks(context) {
    const { bullets, tanks: allTanks } = yield effects_1.select();
    const activeTanks = allTanks.filter(t => t.active);
    // 子弹与坦克碰撞的规则
    // 1. player的子弹打到player-tank: player-tank将会停滞若干时间
    // 2. player的子弹打到AI-tank: AI-tank扣血
    // 3. AI的子弹打到player-tank: player-tank扣血/死亡
    // 4. AI的子弹达到AI-tank: 不发生任何事件
    for (const bullet of bullets.values()) {
        for (const tank of activeTanks.values()) {
            if (tank.tankId === bullet.tankId) {
                // 如果是自己发射的子弹, 则不需要进行处理
                continue;
            }
            const subject = {
                x: tank.x,
                y: tank.y,
                width: constants_1.BLOCK_SIZE,
                height: constants_1.BLOCK_SIZE,
            };
            if (common_1.testCollide(subject, common_1.asBox(bullet), -0.02)) {
                const bulletSide = allTanks.find(t => (t.tankId === bullet.tankId)).side;
                const tankSide = tank.side;
                if (bulletSide === 'human' && tankSide === 'human') {
                    context.expBulletIdSet.add(bullet.bulletId);
                    context.frozenTankIdSet.add(tank.tankId);
                }
                else if (bulletSide === 'human' && tankSide === 'ai') {
                    const hurtSubMap = getOrDefault(context.tankHurtMap, tank.tankId, () => new Map());
                    const oldHurt = hurtSubMap.get(tank.tankId) || 0;
                    hurtSubMap.set(bullet.tankId, oldHurt + 1);
                    context.expBulletIdSet.add(bullet.bulletId);
                }
                else if (bulletSide === 'ai' && tankSide === 'human') {
                    if (tank.helmetDuration > 0) {
                        context.noExpBulletIdSet.add(bullet.bulletId);
                    }
                    else {
                        const hurtSubMap = getOrDefault(context.tankHurtMap, tank.tankId, () => new Map());
                        const oldHurt = hurtSubMap.get(tank.tankId) || 0;
                        hurtSubMap.set(bullet.tankId, oldHurt + 1);
                        context.expBulletIdSet.add(bullet.bulletId);
                    }
                }
                else if (bulletSide === 'ai' && tankSide === 'ai') {
                    // 子弹会穿过坦克
                    // context.noExpBulletIdSet.add(bullet.bulletId)
                }
                else {
                    throw new Error('Error side status');
                }
            }
        }
    }
}
function* handleBulletsCollidedWithBullets(context) {
    const { bullets } = yield effects_1.select();
    for (const bullet of bullets.values()) {
        const subject = common_1.asBox(bullet);
        for (const other of bullets.values()) {
            if (bullet.bulletId === other.bulletId) {
                continue;
            }
            const object = common_1.asBox(other);
            if (common_1.testCollide(subject, object)) {
                context.noExpBulletIdSet.add(bullet.bulletId);
            }
        }
    }
}
function* handleAfterTick() {
    while (true) {
        yield effects_1.take('AFTER_TICK');
        const { bullets, players, tanks: allTanks } = yield effects_1.select();
        const activeTanks = allTanks.filter(t => t.active);
        const bulletsCollidedWithEagle = yield* filterBulletsCollidedWithEagle(bullets);
        if (!bulletsCollidedWithEagle.isEmpty()) {
            yield effects_1.put({
                type: 'DESTROY_BULLETS',
                bullets: bulletsCollidedWithEagle,
                spawnExplosion: true,
            });
            yield effects_1.put({ type: 'DESTROY_EAGLE' });
            // DESTROY_EAGLE被dispatch之后将会触发游戏失败的流程
        }
        // 新建一个统计对象(context), 用来存放这一个tick中的统计信息
        // 注意这里的Set是ES2015的原生Set
        const context = {
            expBulletIdSet: new Set(),
            noExpBulletIdSet: new Set(),
            tankHurtMap: new Map(),
            frozenTankIdSet: new Set(),
        };
        yield* handleBulletsCollidedWithTanks(context);
        yield* handleBulletsCollidedWithBullets(context);
        yield* handleBulletsCollidedWithBricks(context);
        yield* handleBulletsCollidedWithSteels(context);
        // 产生爆炸效果的的子弹
        const expBullets = bullets.filter(bullet => context.expBulletIdSet.has(bullet.bulletId));
        if (!expBullets.isEmpty()) {
            yield effects_1.put({
                type: 'DESTROY_BULLETS',
                bullets: expBullets,
                spawnExplosion: true,
            });
            // 产生爆炸效果的子弹才会破坏附近的brickWall和steelWall
            yield* destroyBricks(expBullets);
            yield* destroySteels(expBullets);
        }
        // 更新被友军击中的坦克的frozenTimeout
        for (const tankId of context.frozenTankIdSet) {
            yield effects_1.put({
                type: 'SET_FROZEN_TIMEOUT',
                tankId,
                frozenTimeout: 500,
            });
        }
        const kills = [];
        const destroyedTankIdSet = new Set();
        // 坦克伤害结算
        for (const [targetTankId, hurtMap] of context.tankHurtMap.entries()) {
            const hurt = sum(hurtMap.values());
            const targetTank = activeTanks.get(targetTankId);
            if (hurt >= targetTank.hp) {
                // 击杀了目标坦克
                const sourceTankId = hurtMap.keys().next().value;
                kills.push(effects_1.put({
                    type: 'KILL',
                    targetTank,
                    // 注意这里用allTanks, 因为sourceTank在这个时候可能已经挂了
                    sourceTank: allTanks.get(sourceTankId),
                    targetPlayer: players.find(p => p.activeTankId === targetTankId),
                    sourcePlayer: players.find(p => p.activeTankId === sourceTankId),
                }));
                destroyedTankIdSet.add(targetTankId);
            }
            else {
                yield effects_1.put({ type: 'HURT', targetTank, hurt });
            }
        }
        if (destroyedTankIdSet.size > 0) {
            // 移除坦克 & 产生爆炸效果
            yield* destroyTanks(immutable_1.Set(destroyedTankIdSet));
            // 显示击杀得分
            const destroyedAITanks = immutable_1.Set(destroyedTankIdSet)
                .map(tankId => allTanks.get(tankId))
                .filter(tank => tank.side === 'ai');
            if (destroyedAITanks.size > 0) {
                yield* destroyedAITanks.map(makeScoreFromTank);
            }
        }
        // notice KillAction是在destroyTanks之后被dispatch的; 此时地图上的坦克已经被去除了
        yield* kills;
        // 不产生爆炸, 直接消失的子弹
        const noExpBullets = bullets.filter(bullet => context.noExpBulletIdSet.has(bullet.bulletId));
        if (context.noExpBulletIdSet.size > 0) {
            yield effects_1.put({
                type: 'DESTROY_BULLETS',
                bullets: noExpBullets,
                spawnExplosion: false,
            });
        }
        // 移除在边界外面的子弹
        const outsideBullets = bullets.filterNot(isBulletInField);
        if (!outsideBullets.isEmpty()) {
            yield effects_1.put({
                type: 'DESTROY_BULLETS',
                bullets: outsideBullets,
                spawnExplosion: true,
            });
        }
    }
}
function* bulletsSaga() {
    yield effects_1.fork(handleTick);
    yield effects_1.fork(handleAfterTick);
    yield effects_1.fork(function* handleDestroyBullets() {
        while (true) {
            const { bullets, spawnExplosion } = yield effects_1.take('DESTROY_BULLETS');
            if (spawnExplosion) {
                yield* bullets.map(makeExplosionFromBullet).values();
            }
        }
    });
}
exports.default = bulletsSaga;


/***/ }),

/***/ 156:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(157);
module.exports = __webpack_require__(160);


/***/ }),

/***/ 157:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(158);


/***/ }),

/***/ 158:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* eslint-disable global-require */



if (true) {
  module.exports = __webpack_require__(159);
} else {
  module.exports = require('./patch.dev');
}

/***/ }),

/***/ 159:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* noop */


/***/ }),

/***/ 160:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(51);
const React = __webpack_require__(0);
const ReactDOM = __webpack_require__(52);
const react_hot_loader_1 = __webpack_require__(251);
const react_redux_1 = __webpack_require__(11);
const store_1 = __webpack_require__(281);
const App_1 = __webpack_require__(345);
function render(Component) {
    ReactDOM.render(React.createElement(react_hot_loader_1.AppContainer, null,
        React.createElement(react_redux_1.Provider, { store: store_1.default },
            React.createElement(Component, null))), document.getElementById('container'));
}
// initial render
render(App_1.default);
if (false) {
    module.hot.accept('./App.tsx', () => {
        // hot-reload for App
        render(require('./App').default);
    });
}


/***/ }),

/***/ 251:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(252);


/***/ }),

/***/ 252:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* eslint-disable global-require */



if (true) {
  module.exports = __webpack_require__(253);
} else {
  module.exports = require('./index.dev');
}

/***/ }),

/***/ 253:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports.AppContainer = __webpack_require__(254);

/***/ }),

/***/ 254:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* eslint-disable global-require */



if (true) {
  module.exports = __webpack_require__(255);
} else {
  module.exports = require('./AppContainer.dev');
}

/***/ }),

/***/ 255:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* eslint-disable react/prop-types */



var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = __webpack_require__(0);
var Component = React.Component;

var AppContainer = function (_Component) {
  _inherits(AppContainer, _Component);

  function AppContainer() {
    _classCallCheck(this, AppContainer);

    return _possibleConstructorReturn(this, (AppContainer.__proto__ || Object.getPrototypeOf(AppContainer)).apply(this, arguments));
  }

  _createClass(AppContainer, [{
    key: 'render',
    value: function render() {
      if (this.props.component) {
        return React.createElement(this.props.component, this.props.props);
      }

      return React.Children.only(this.props.children);
    }
  }]);

  return AppContainer;
}(Component);

module.exports = AppContainer;

/***/ }),

/***/ 281:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = __webpack_require__(40);
const redux_saga_1 = __webpack_require__(17);
const index_1 = __webpack_require__(49);
const index_2 = __webpack_require__(335);
const sagaMiddleware = redux_saga_1.default();
exports.default = redux_1.createStore(index_1.default, redux_1.applyMiddleware(sagaMiddleware));
sagaMiddleware.run(index_2.default);


/***/ }),

/***/ 33:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const _ = __webpack_require__(22);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(8);
// 选取玩家的坦克对象. 如果玩家当前没有坦克, 则返回null
exports.playerTank = (state, playerName) => {
    const { active, activeTankId } = state.players.get(playerName);
    if (!active) {
        return null;
    }
    return state.tanks.get(activeTankId, null);
};
exports.availableSpawnPosition = ({ tanks }) => {
    const result = [];
    const activeTanks = tanks.filter(t => t.active);
    outer: for (const x of [0, 6 * constants_1.BLOCK_SIZE, 12 * constants_1.BLOCK_SIZE]) {
        const option = { x, y: 0, width: constants_1.TANK_SIZE, height: constants_1.TANK_SIZE };
        for (const tank of activeTanks.values()) {
            if (common_1.testCollide(option, { x: tank.x, y: tank.y, width: constants_1.TANK_SIZE, height: constants_1.TANK_SIZE })) {
                continue outer;
            }
        }
        result.push(option);
    }
    return _.sample(result);
};
exports.validPowerUpSpawnPositions = ({ map: { bricks, rivers, steels, eagle } }) => {
    // notice powerUp的显示大小为16*16, 但是碰撞大小为中间的8*8
    const validPositions = [];
    for (let y = 0; y < (constants_1.FIELD_BLOCK_SIZE - 1) * constants_1.BLOCK_SIZE; y += 0.5 * constants_1.BLOCK_SIZE) {
        for (let x = 0; x < (constants_1.FIELD_BLOCK_SIZE - 1) * constants_1.BLOCK_SIZE; x += 0.5 * constants_1.BLOCK_SIZE) {
            let collideCount = 0;
            partLoop: for (const part of [
                { x: x + 4, y: y + 4, width: 4, height: 4 },
                { x: x + 8, y: y + 4, width: 4, height: 4 },
                { x: x + 4, y: y + 8, width: 4, height: 4 },
                { x: x + 8, y: y + 8, width: 4, height: 4 },
            ]) {
                for (const [brow, bcol] of common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, part)) {
                    if (bricks.get(brow * constants_1.N_MAP.BRICK + bcol)) {
                        collideCount++;
                        continue partLoop;
                    }
                }
                for (const [trow, tcol] of common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.STEEL, part)) {
                    if (steels.get(trow * constants_1.N_MAP.STEEL + tcol)) {
                        collideCount++;
                        continue partLoop;
                    }
                }
                for (const [rrow, rcol] of common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.RIVER, part)) {
                    if (rivers.get(rrow * constants_1.N_MAP.RIVER + rcol)) {
                        collideCount++;
                        continue partLoop;
                    }
                }
                if (common_1.testCollide(common_1.asBox(eagle), part)) {
                    collideCount++;
                    continue partLoop;
                }
            }
            if (collideCount === 1 || collideCount === 2 || collideCount === 3) {
                validPositions.push({ x, y });
            }
        }
    }
    return validPositions;
};


/***/ }),

/***/ 335:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(17);
const effects_1 = __webpack_require__(12);
const humanController_1 = __webpack_require__(336);
const bulletsSaga_1 = __webpack_require__(151);
const gameManager_1 = __webpack_require__(339);
const AISaga_1 = __webpack_require__(341);
const tickEmitter_1 = __webpack_require__(76);
const constants_1 = __webpack_require__(2);
const humanPlayerSaga_1 = __webpack_require__(343);
const powerUps_1 = __webpack_require__(344);
function* autoRemoveEffects() {
    yield effects_1.takeEvery('SPAWN_EXPLOSION', function* removeExplosion({ explosionId, explosionType }) {
        if (explosionType === 'bullet') {
            yield redux_saga_1.delay(200);
        }
        else if (explosionType === 'tank') {
            yield redux_saga_1.delay(500);
        }
        yield effects_1.put({ type: 'REMOVE_EXPLOSION', explosionId });
    });
    yield effects_1.takeEvery('SPAWN_FLICKER', function* removeFlicker({ flickerId }) {
        yield redux_saga_1.delay(constants_1.TANK_SPAWN_DELAY);
        yield effects_1.put({ type: 'REMOVE_FLICKER', flickerId });
    });
    yield effects_1.takeEvery('ADD_SCORE', function* removeScore({ score: { scoreId } }) {
        yield redux_saga_1.delay(2000);
        yield effects_1.put({ type: 'REMOVE_SCORE', scoreId });
    });
}
function* rootSaga() {
    console.debug('root saga started');
    yield effects_1.fork(tickEmitter_1.default);
    yield effects_1.fork(bulletsSaga_1.default);
    yield effects_1.fork(autoRemoveEffects);
    yield effects_1.fork(powerUps_1.default);
    // 生成两个humanController, 对应现实生活的游戏控制器
    yield effects_1.fork(humanController_1.default, 'player-1', constants_1.CONTROL_CONFIG.player1);
    yield effects_1.fork(humanController_1.default, 'player-2', constants_1.CONTROL_CONFIG.player2);
    yield effects_1.fork(AISaga_1.default);
    yield effects_1.fork(humanPlayerSaga_1.default, 'player-1', 'yellow');
    // yield fork(humanPlayerSaga, 'player-2')
    yield effects_1.fork(gameManager_1.default);
}
exports.default = rootSaga;


/***/ }),

/***/ 336:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(12);
const selectors = __webpack_require__(33);
const _ = __webpack_require__(22);
const directionController_1 = __webpack_require__(149);
const fireController_1 = __webpack_require__(150);
const Mousetrap = __webpack_require__(338);
// 一个humanController实例对应一个人类玩家(用户)的控制器(键盘或是手柄).
// 参数playerName用来指定人类玩家的玩家名称, config为该玩家的操作配置.
// humanController启动后, 会监听ACTIVATE_PLAYER action.
// 如果action与参数playerName相对应, 则该humanController将启动
// fireController与directionController, 从而控制人类玩家的坦克
function* humanController(playerName, config) {
    let firePressing = false; // 用来记录当前玩家是否按下了fire键
    let firePressed = false; // 用来记录上一个tick内 玩家是否按下过fire键
    Mousetrap.bind(config.fire, () => {
        firePressing = true;
        firePressed = true;
    }, 'keydown');
    Mousetrap.bind(config.fire, () => (firePressing = false), 'keyup');
    // 每次tick时, 都将firePressed重置
    yield effects_1.fork(function* handleTick() {
        while (true) {
            yield effects_1.take('TICK');
            firePressed = false;
        }
    });
    // 用来记录上一个tick内, 玩家按下过的方向键
    const pressed = [];
    // 调用该函数用来获取当前人类玩家的移动操作(控制器级别)
    function getDirectionControlInfo() {
        if (pressed.length > 0) {
            return { direction: _.last(pressed) };
        }
        else {
            return { direction: null };
        }
    }
    // 调用该函数用来获取当前玩家的开火操作
    function shouldFire() {
        return firePressing || firePressed;
    }
    function bindKeyWithDirection(key, direction) {
        Mousetrap.bind(key, () => {
            if (pressed.indexOf(direction) === -1) {
                pressed.push(direction);
            }
        }, 'keydown');
        Mousetrap.bind(key, () => {
            _.pull(pressed, direction);
        }, 'keyup');
    }
    bindKeyWithDirection(config.up, 'up');
    bindKeyWithDirection(config.left, 'left');
    bindKeyWithDirection(config.down, 'down');
    bindKeyWithDirection(config.right, 'right');
    // 调用该函数来获取当前用户的移动操作(坦克级别)
    function* getHumanPlayerInput() {
        const tank = yield effects_1.select(selectors.playerTank, playerName);
        if (tank != null) {
            const { direction } = getDirectionControlInfo();
            if (direction != null) {
                if (direction !== tank.direction) {
                    return { type: 'turn', direction };
                }
                else {
                    return { type: 'forward' };
                }
            }
        }
        return null;
    }
    while (true) {
        const action = yield effects_1.take('ACTIVATE_PLAYER');
        if (action.playerName === playerName) {
            yield effects_1.all([
                directionController_1.default(playerName, getHumanPlayerInput),
                fireController_1.default(playerName, shouldFire),
            ]);
        }
        // todo 玩家tank炸了
    }
}
exports.default = humanController;


/***/ }),

/***/ 337:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = __webpack_require__(8);
const constants_1 = __webpack_require__(2);
function isTankCollidedWithEagle(eagle, tankTarget, threshhold) {
    const eagleBox = {
        x: eagle.x,
        y: eagle.y,
        width: constants_1.BLOCK_SIZE,
        height: constants_1.BLOCK_SIZE,
    };
    return common_1.testCollide(eagleBox, tankTarget, threshhold);
}
function isTankCollidedWithBricks(bricks, tankTarget, threshhold) {
    const itemSize = constants_1.ITEM_SIZE_MAP.BRICK;
    for (const [row, col] of common_1.iterRowsAndCols(itemSize, tankTarget)) {
        const t = row * constants_1.N_MAP.BRICK + col;
        if (bricks.get(t)) {
            const subject = {
                x: col * itemSize,
                y: row * itemSize,
                width: itemSize,
                height: itemSize,
            };
            // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
            if (common_1.testCollide(subject, tankTarget, threshhold)) {
                return true;
            }
        }
    }
    return false;
}
function isTankCollidedWithSteels(steels, tankTarget, threshhold) {
    const itemSize = constants_1.ITEM_SIZE_MAP.STEEL;
    for (const [row, col] of common_1.iterRowsAndCols(itemSize, tankTarget)) {
        const t = row * constants_1.N_MAP.STEEL + col;
        if (steels.get(t)) {
            const subject = {
                x: col * itemSize,
                y: row * itemSize,
                width: itemSize,
                height: itemSize,
            };
            // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
            if (common_1.testCollide(subject, tankTarget, threshhold)) {
                return true;
            }
        }
    }
    return false;
}
function isTankCollidedWithRivers(rivers, tankTarget, threshhold) {
    const itemSize = constants_1.ITEM_SIZE_MAP.RIVER;
    for (const [row, col] of common_1.iterRowsAndCols(itemSize, tankTarget)) {
        const t = row * constants_1.N_MAP.RIVER + col;
        if (rivers.get(t)) {
            const subject = {
                x: col * itemSize,
                y: row * itemSize,
                width: itemSize,
                height: itemSize,
            };
            // 因为要考虑threshhold, 所以仍然要调用testCollide来判断是否相撞
            if (common_1.testCollide(subject, tankTarget, threshhold)) {
                return true;
            }
        }
    }
    return false;
}
function isTankCollidedWithOtherTanks(activeTanks, tank, tankTarget, threshhold) {
    // 判断坦克与其他坦克是否相撞
    for (const otherTank of activeTanks.values()) {
        if (tank.tankId === otherTank.tankId) {
            continue;
        }
        const subject = common_1.asBox(otherTank);
        if (common_1.testCollide(subject, tankTarget, threshhold)) {
            return true;
        }
    }
    return false;
}
function canTankMove({ tanks, map: { bricks, steels, rivers, eagle } }, tank, threshhold = -0.01) {
    const tankBox = common_1.asBox(tank);
    // 判断是否位于战场内
    if (!common_1.isInField(tankBox)) {
        return false;
    }
    // 判断是否与地形相碰撞
    if (isTankCollidedWithEagle(eagle, tankBox, threshhold)) {
        return false;
    }
    if (isTankCollidedWithBricks(bricks, tankBox, threshhold)) {
        return false;
    }
    if (isTankCollidedWithSteels(steels, tankBox, threshhold)) {
        return false;
    }
    if (isTankCollidedWithRivers(rivers, tankBox, threshhold)) {
        return false;
    }
    // 判断是否与其他坦克相碰撞
    const activeTanks = tanks.filter(t => t.active);
    if (isTankCollidedWithOtherTanks(activeTanks, tank, tankBox, threshhold)) {
        return false;
    }
    // 与其他物品都没有相撞, 则表示可以进行移动
    return true;
}
exports.default = canTankMove;


/***/ }),

/***/ 338:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/*global define:false */
/**
 * Copyright 2012-2017 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.6.1
 * @url craig.is/killing/mice
 */
(function(window, document, undefined) {

    // Check if mousetrap is used inside browser, if not, return
    if (!window) {
        return;
    }

    /**
     * mapping of special keycodes to their corresponding keys
     *
     * everything in this dictionary cannot use keypress events
     * so it has to be here to map to the correct keycodes for
     * keyup/keydown events
     *
     * @type {Object}
     */
    var _MAP = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        20: 'capslock',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'ins',
        46: 'del',
        91: 'meta',
        93: 'meta',
        224: 'meta'
    };

    /**
     * mapping for special characters so they can support
     *
     * this dictionary is only used incase you want to bind a
     * keyup or keydown event to one of these keys
     *
     * @type {Object}
     */
    var _KEYCODE_MAP = {
        106: '*',
        107: '+',
        109: '-',
        110: '.',
        111 : '/',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: '\''
    };

    /**
     * this is a mapping of keys that require shift on a US keypad
     * back to the non shift equivelents
     *
     * this is so you can use keyup events with these keys
     *
     * note that this will only work reliably on US keyboards
     *
     * @type {Object}
     */
    var _SHIFT_MAP = {
        '~': '`',
        '!': '1',
        '@': '2',
        '#': '3',
        '$': '4',
        '%': '5',
        '^': '6',
        '&': '7',
        '*': '8',
        '(': '9',
        ')': '0',
        '_': '-',
        '+': '=',
        ':': ';',
        '\"': '\'',
        '<': ',',
        '>': '.',
        '?': '/',
        '|': '\\'
    };

    /**
     * this is a list of special strings you can use to map
     * to modifier keys when you specify your keyboard shortcuts
     *
     * @type {Object}
     */
    var _SPECIAL_ALIASES = {
        'option': 'alt',
        'command': 'meta',
        'return': 'enter',
        'escape': 'esc',
        'plus': '+',
        'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
    };

    /**
     * variable to store the flipped version of _MAP from above
     * needed to check if we should use keypress or not when no action
     * is specified
     *
     * @type {Object|undefined}
     */
    var _REVERSE_MAP;

    /**
     * loop through the f keys, f1 to f19 and add them to the map
     * programatically
     */
    for (var i = 1; i < 20; ++i) {
        _MAP[111 + i] = 'f' + i;
    }

    /**
     * loop through to map numbers on the numeric keypad
     */
    for (i = 0; i <= 9; ++i) {

        // This needs to use a string cause otherwise since 0 is falsey
        // mousetrap will never fire for numpad 0 pressed as part of a keydown
        // event.
        //
        // @see https://github.com/ccampbell/mousetrap/pull/258
        _MAP[i + 96] = i.toString();
    }

    /**
     * cross browser add event method
     *
     * @param {Element|HTMLDocument} object
     * @param {string} type
     * @param {Function} callback
     * @returns void
     */
    function _addEvent(object, type, callback) {
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
            return;
        }

        object.attachEvent('on' + type, callback);
    }

    /**
     * takes the event and returns the key character
     *
     * @param {Event} e
     * @return {string}
     */
    function _characterFromEvent(e) {

        // for keypress events we should return the character as is
        if (e.type == 'keypress') {
            var character = String.fromCharCode(e.which);

            // if the shift key is not pressed then it is safe to assume
            // that we want the character to be lowercase.  this means if
            // you accidentally have caps lock on then your key bindings
            // will continue to work
            //
            // the only side effect that might not be desired is if you
            // bind something like 'A' cause you want to trigger an
            // event when capital A is pressed caps lock will no longer
            // trigger the event.  shift+a will though.
            if (!e.shiftKey) {
                character = character.toLowerCase();
            }

            return character;
        }

        // for non keypress events the special maps are needed
        if (_MAP[e.which]) {
            return _MAP[e.which];
        }

        if (_KEYCODE_MAP[e.which]) {
            return _KEYCODE_MAP[e.which];
        }

        // if it is not in the special map

        // with keydown and keyup events the character seems to always
        // come in as an uppercase character whether you are pressing shift
        // or not.  we should make sure it is always lowercase for comparisons
        return String.fromCharCode(e.which).toLowerCase();
    }

    /**
     * checks if two arrays are equal
     *
     * @param {Array} modifiers1
     * @param {Array} modifiers2
     * @returns {boolean}
     */
    function _modifiersMatch(modifiers1, modifiers2) {
        return modifiers1.sort().join(',') === modifiers2.sort().join(',');
    }

    /**
     * takes a key event and figures out what the modifiers are
     *
     * @param {Event} e
     * @returns {Array}
     */
    function _eventModifiers(e) {
        var modifiers = [];

        if (e.shiftKey) {
            modifiers.push('shift');
        }

        if (e.altKey) {
            modifiers.push('alt');
        }

        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }

        if (e.metaKey) {
            modifiers.push('meta');
        }

        return modifiers;
    }

    /**
     * prevents default for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _preventDefault(e) {
        if (e.preventDefault) {
            e.preventDefault();
            return;
        }

        e.returnValue = false;
    }

    /**
     * stops propogation for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _stopPropagation(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
            return;
        }

        e.cancelBubble = true;
    }

    /**
     * determines if the keycode specified is a modifier key or not
     *
     * @param {string} key
     * @returns {boolean}
     */
    function _isModifier(key) {
        return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
    }

    /**
     * reverses the map lookup so that we can look for specific keys
     * to see what can and can't use keypress
     *
     * @return {Object}
     */
    function _getReverseMap() {
        if (!_REVERSE_MAP) {
            _REVERSE_MAP = {};
            for (var key in _MAP) {

                // pull out the numeric keypad from here cause keypress should
                // be able to detect the keys from the character
                if (key > 95 && key < 112) {
                    continue;
                }

                if (_MAP.hasOwnProperty(key)) {
                    _REVERSE_MAP[_MAP[key]] = key;
                }
            }
        }
        return _REVERSE_MAP;
    }

    /**
     * picks the best action based on the key combination
     *
     * @param {string} key - character for key
     * @param {Array} modifiers
     * @param {string=} action passed in
     */
    function _pickBestAction(key, modifiers, action) {

        // if no action was picked in we should try to pick the one
        // that we think would work best for this key
        if (!action) {
            action = _getReverseMap()[key] ? 'keydown' : 'keypress';
        }

        // modifier keys don't work as expected with keypress,
        // switch to keydown
        if (action == 'keypress' && modifiers.length) {
            action = 'keydown';
        }

        return action;
    }

    /**
     * Converts from a string key combination to an array
     *
     * @param  {string} combination like "command+shift+l"
     * @return {Array}
     */
    function _keysFromString(combination) {
        if (combination === '+') {
            return ['+'];
        }

        combination = combination.replace(/\+{2}/g, '+plus');
        return combination.split('+');
    }

    /**
     * Gets info for a specific key combination
     *
     * @param  {string} combination key combination ("command+s" or "a" or "*")
     * @param  {string=} action
     * @returns {Object}
     */
    function _getKeyInfo(combination, action) {
        var keys;
        var key;
        var i;
        var modifiers = [];

        // take the keys from this pattern and figure out what the actual
        // pattern is all about
        keys = _keysFromString(combination);

        for (i = 0; i < keys.length; ++i) {
            key = keys[i];

            // normalize key names
            if (_SPECIAL_ALIASES[key]) {
                key = _SPECIAL_ALIASES[key];
            }

            // if this is not a keypress event then we should
            // be smart about using shift keys
            // this will only work for US keyboards however
            if (action && action != 'keypress' && _SHIFT_MAP[key]) {
                key = _SHIFT_MAP[key];
                modifiers.push('shift');
            }

            // if this key is a modifier then add it to the list of modifiers
            if (_isModifier(key)) {
                modifiers.push(key);
            }
        }

        // depending on what the key combination is
        // we will try to pick the best event for it
        action = _pickBestAction(key, modifiers, action);

        return {
            key: key,
            modifiers: modifiers,
            action: action
        };
    }

    function _belongsTo(element, ancestor) {
        if (element === null || element === document) {
            return false;
        }

        if (element === ancestor) {
            return true;
        }

        return _belongsTo(element.parentNode, ancestor);
    }

    function Mousetrap(targetElement) {
        var self = this;

        targetElement = targetElement || document;

        if (!(self instanceof Mousetrap)) {
            return new Mousetrap(targetElement);
        }

        /**
         * element to attach key events to
         *
         * @type {Element}
         */
        self.target = targetElement;

        /**
         * a list of all the callbacks setup via Mousetrap.bind()
         *
         * @type {Object}
         */
        self._callbacks = {};

        /**
         * direct map of string combinations to callbacks used for trigger()
         *
         * @type {Object}
         */
        self._directMap = {};

        /**
         * keeps track of what level each sequence is at since multiple
         * sequences can start out with the same sequence
         *
         * @type {Object}
         */
        var _sequenceLevels = {};

        /**
         * variable to store the setTimeout call
         *
         * @type {null|number}
         */
        var _resetTimer;

        /**
         * temporary state where we will ignore the next keyup
         *
         * @type {boolean|string}
         */
        var _ignoreNextKeyup = false;

        /**
         * temporary state where we will ignore the next keypress
         *
         * @type {boolean}
         */
        var _ignoreNextKeypress = false;

        /**
         * are we currently inside of a sequence?
         * type of action ("keyup" or "keydown" or "keypress") or false
         *
         * @type {boolean|string}
         */
        var _nextExpectedAction = false;

        /**
         * resets all sequence counters except for the ones passed in
         *
         * @param {Object} doNotReset
         * @returns void
         */
        function _resetSequences(doNotReset) {
            doNotReset = doNotReset || {};

            var activeSequences = false,
                key;

            for (key in _sequenceLevels) {
                if (doNotReset[key]) {
                    activeSequences = true;
                    continue;
                }
                _sequenceLevels[key] = 0;
            }

            if (!activeSequences) {
                _nextExpectedAction = false;
            }
        }

        /**
         * finds all callbacks that match based on the keycode, modifiers,
         * and action
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event|Object} e
         * @param {string=} sequenceName - name of the sequence we are looking for
         * @param {string=} combination
         * @param {number=} level
         * @returns {Array}
         */
        function _getMatches(character, modifiers, e, sequenceName, combination, level) {
            var i;
            var callback;
            var matches = [];
            var action = e.type;

            // if there are no events related to this keycode
            if (!self._callbacks[character]) {
                return [];
            }

            // if a modifier key is coming up on its own we should allow it
            if (action == 'keyup' && _isModifier(character)) {
                modifiers = [character];
            }

            // loop through all callbacks for the key that was pressed
            // and see if any of them match
            for (i = 0; i < self._callbacks[character].length; ++i) {
                callback = self._callbacks[character][i];

                // if a sequence name is not specified, but this is a sequence at
                // the wrong level then move onto the next match
                if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
                    continue;
                }

                // if the action we are looking for doesn't match the action we got
                // then we should keep going
                if (action != callback.action) {
                    continue;
                }

                // if this is a keypress event and the meta key and control key
                // are not pressed that means that we need to only look at the
                // character, otherwise check the modifiers as well
                //
                // chrome will not fire a keypress if meta or control is down
                // safari will fire a keypress if meta or meta+shift is down
                // firefox will fire a keypress if meta or control is down
                if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {

                    // when you bind a combination or sequence a second time it
                    // should overwrite the first one.  if a sequenceName or
                    // combination is specified in this call it does just that
                    //
                    // @todo make deleting its own method?
                    var deleteCombo = !sequenceName && callback.combo == combination;
                    var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
                    if (deleteCombo || deleteSequence) {
                        self._callbacks[character].splice(i, 1);
                    }

                    matches.push(callback);
                }
            }

            return matches;
        }

        /**
         * actually calls the callback function
         *
         * if your callback function returns false this will use the jquery
         * convention - prevent default and stop propogation on the event
         *
         * @param {Function} callback
         * @param {Event} e
         * @returns void
         */
        function _fireCallback(callback, e, combo, sequence) {

            // if this event should not happen stop here
            if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
                return;
            }

            if (callback(e, combo) === false) {
                _preventDefault(e);
                _stopPropagation(e);
            }
        }

        /**
         * handles a character key event
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event} e
         * @returns void
         */
        self._handleKey = function(character, modifiers, e) {
            var callbacks = _getMatches(character, modifiers, e);
            var i;
            var doNotReset = {};
            var maxLevel = 0;
            var processedSequenceCallback = false;

            // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
            for (i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].seq) {
                    maxLevel = Math.max(maxLevel, callbacks[i].level);
                }
            }

            // loop through matching callbacks for this key event
            for (i = 0; i < callbacks.length; ++i) {

                // fire for all sequence callbacks
                // this is because if for example you have multiple sequences
                // bound such as "g i" and "g t" they both need to fire the
                // callback for matching g cause otherwise you can only ever
                // match the first one
                if (callbacks[i].seq) {

                    // only fire callbacks for the maxLevel to prevent
                    // subsequences from also firing
                    //
                    // for example 'a option b' should not cause 'option b' to fire
                    // even though 'option b' is part of the other sequence
                    //
                    // any sequences that do not match here will be discarded
                    // below by the _resetSequences call
                    if (callbacks[i].level != maxLevel) {
                        continue;
                    }

                    processedSequenceCallback = true;

                    // keep a list of which sequences were matches for later
                    doNotReset[callbacks[i].seq] = 1;
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
                    continue;
                }

                // if there were no sequence matches but we are still here
                // that means this is a regular match so we should fire that
                if (!processedSequenceCallback) {
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
                }
            }

            // if the key you pressed matches the type of sequence without
            // being a modifier (ie "keyup" or "keypress") then we should
            // reset all sequences that were not matched by this event
            //
            // this is so, for example, if you have the sequence "h a t" and you
            // type "h e a r t" it does not match.  in this case the "e" will
            // cause the sequence to reset
            //
            // modifier keys are ignored because you can have a sequence
            // that contains modifiers such as "enter ctrl+space" and in most
            // cases the modifier key will be pressed before the next key
            //
            // also if you have a sequence such as "ctrl+b a" then pressing the
            // "b" key will trigger a "keypress" and a "keydown"
            //
            // the "keydown" is expected when there is a modifier, but the
            // "keypress" ends up matching the _nextExpectedAction since it occurs
            // after and that causes the sequence to reset
            //
            // we ignore keypresses in a sequence that directly follow a keydown
            // for the same character
            var ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
            if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
                _resetSequences(doNotReset);
            }

            _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
        };

        /**
         * handles a keydown event
         *
         * @param {Event} e
         * @returns void
         */
        function _handleKeyEvent(e) {

            // normalize e.which for key events
            // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
            if (typeof e.which !== 'number') {
                e.which = e.keyCode;
            }

            var character = _characterFromEvent(e);

            // no character found then stop
            if (!character) {
                return;
            }

            // need to use === for the character check because the character can be 0
            if (e.type == 'keyup' && _ignoreNextKeyup === character) {
                _ignoreNextKeyup = false;
                return;
            }

            self.handleKey(character, _eventModifiers(e), e);
        }

        /**
         * called to set a 1 second timeout on the specified sequence
         *
         * this is so after each key press in the sequence you have 1 second
         * to press the next key before you have to start over
         *
         * @returns void
         */
        function _resetSequenceTimer() {
            clearTimeout(_resetTimer);
            _resetTimer = setTimeout(_resetSequences, 1000);
        }

        /**
         * binds a key sequence to an event
         *
         * @param {string} combo - combo specified in bind call
         * @param {Array} keys
         * @param {Function} callback
         * @param {string=} action
         * @returns void
         */
        function _bindSequence(combo, keys, callback, action) {

            // start off by adding a sequence level record for this combination
            // and setting the level to 0
            _sequenceLevels[combo] = 0;

            /**
             * callback to increase the sequence level for this sequence and reset
             * all other sequences that were active
             *
             * @param {string} nextAction
             * @returns {Function}
             */
            function _increaseSequence(nextAction) {
                return function() {
                    _nextExpectedAction = nextAction;
                    ++_sequenceLevels[combo];
                    _resetSequenceTimer();
                };
            }

            /**
             * wraps the specified callback inside of another function in order
             * to reset all sequence counters as soon as this sequence is done
             *
             * @param {Event} e
             * @returns void
             */
            function _callbackAndReset(e) {
                _fireCallback(callback, e, combo);

                // we should ignore the next key up if the action is key down
                // or keypress.  this is so if you finish a sequence and
                // release the key the final key will not trigger a keyup
                if (action !== 'keyup') {
                    _ignoreNextKeyup = _characterFromEvent(e);
                }

                // weird race condition if a sequence ends with the key
                // another sequence begins with
                setTimeout(_resetSequences, 10);
            }

            // loop through keys one at a time and bind the appropriate callback
            // function.  for any key leading up to the final one it should
            // increase the sequence. after the final, it should reset all sequences
            //
            // if an action is specified in the original bind call then that will
            // be used throughout.  otherwise we will pass the action that the
            // next key in the sequence should match.  this allows a sequence
            // to mix and match keypress and keydown events depending on which
            // ones are better suited to the key provided
            for (var i = 0; i < keys.length; ++i) {
                var isFinal = i + 1 === keys.length;
                var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
                _bindSingle(keys[i], wrappedCallback, action, combo, i);
            }
        }

        /**
         * binds a single keyboard combination
         *
         * @param {string} combination
         * @param {Function} callback
         * @param {string=} action
         * @param {string=} sequenceName - name of sequence if part of sequence
         * @param {number=} level - what part of the sequence the command is
         * @returns void
         */
        function _bindSingle(combination, callback, action, sequenceName, level) {

            // store a direct mapped reference for use with Mousetrap.trigger
            self._directMap[combination + ':' + action] = callback;

            // make sure multiple spaces in a row become a single space
            combination = combination.replace(/\s+/g, ' ');

            var sequence = combination.split(' ');
            var info;

            // if this pattern is a sequence of keys then run through this method
            // to reprocess each pattern one key at a time
            if (sequence.length > 1) {
                _bindSequence(combination, sequence, callback, action);
                return;
            }

            info = _getKeyInfo(combination, action);

            // make sure to initialize array if this is the first time
            // a callback is added for this key
            self._callbacks[info.key] = self._callbacks[info.key] || [];

            // remove an existing match if there is one
            _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

            // add this call back to the array
            // if it is a sequence put it at the beginning
            // if not put it at the end
            //
            // this is important because the way these are processed expects
            // the sequence ones to come first
            self._callbacks[info.key][sequenceName ? 'unshift' : 'push']({
                callback: callback,
                modifiers: info.modifiers,
                action: info.action,
                seq: sequenceName,
                level: level,
                combo: combination
            });
        }

        /**
         * binds multiple combinations to the same callback
         *
         * @param {Array} combinations
         * @param {Function} callback
         * @param {string|undefined} action
         * @returns void
         */
        self._bindMultiple = function(combinations, callback, action) {
            for (var i = 0; i < combinations.length; ++i) {
                _bindSingle(combinations[i], callback, action);
            }
        };

        // start!
        _addEvent(targetElement, 'keypress', _handleKeyEvent);
        _addEvent(targetElement, 'keydown', _handleKeyEvent);
        _addEvent(targetElement, 'keyup', _handleKeyEvent);
    }

    /**
     * binds an event to mousetrap
     *
     * can be a single key, a combination of keys separated with +,
     * an array of keys, or a sequence of keys separated by spaces
     *
     * be sure to list the modifier keys first to make sure that the
     * correct key ends up getting bound (the last key in the pattern)
     *
     * @param {string|Array} keys
     * @param {Function} callback
     * @param {string=} action - 'keypress', 'keydown', or 'keyup'
     * @returns void
     */
    Mousetrap.prototype.bind = function(keys, callback, action) {
        var self = this;
        keys = keys instanceof Array ? keys : [keys];
        self._bindMultiple.call(self, keys, callback, action);
        return self;
    };

    /**
     * unbinds an event to mousetrap
     *
     * the unbinding sets the callback function of the specified key combo
     * to an empty function and deletes the corresponding key in the
     * _directMap dict.
     *
     * TODO: actually remove this from the _callbacks dictionary instead
     * of binding an empty function
     *
     * the keycombo+action has to be exactly the same as
     * it was defined in the bind method
     *
     * @param {string|Array} keys
     * @param {string} action
     * @returns void
     */
    Mousetrap.prototype.unbind = function(keys, action) {
        var self = this;
        return self.bind.call(self, keys, function() {}, action);
    };

    /**
     * triggers an event that has already been bound
     *
     * @param {string} keys
     * @param {string=} action
     * @returns void
     */
    Mousetrap.prototype.trigger = function(keys, action) {
        var self = this;
        if (self._directMap[keys + ':' + action]) {
            self._directMap[keys + ':' + action]({}, keys);
        }
        return self;
    };

    /**
     * resets the library back to its initial state.  this is useful
     * if you want to clear out the current keyboard shortcuts and bind
     * new ones - for example if you switch to another page
     *
     * @returns void
     */
    Mousetrap.prototype.reset = function() {
        var self = this;
        self._callbacks = {};
        self._directMap = {};
        return self;
    };

    /**
     * should we stop this event before firing off callbacks
     *
     * @param {Event} e
     * @param {Element} element
     * @return {boolean}
     */
    Mousetrap.prototype.stopCallback = function(e, element) {
        var self = this;

        // if the element has the class "mousetrap" then no need to stop
        if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
            return false;
        }

        if (_belongsTo(element, self.target)) {
            return false;
        }

        // stop for input, select, and textarea
        return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
    };

    /**
     * exposes _handleKey publicly so it can be overwritten by extensions
     */
    Mousetrap.prototype.handleKey = function() {
        var self = this;
        return self._handleKey.apply(self, arguments);
    };

    /**
     * allow custom key mappings
     */
    Mousetrap.addKeycodes = function(object) {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                _MAP[key] = object[key];
            }
        }
        _REVERSE_MAP = null;
    };

    /**
     * Init the global mousetrap functions
     *
     * This method is needed to allow the global mousetrap functions to work
     * now that mousetrap is a constructor function.
     */
    Mousetrap.init = function() {
        var documentMousetrap = Mousetrap(document);
        for (var method in documentMousetrap) {
            if (method.charAt(0) !== '_') {
                Mousetrap[method] = (function(method) {
                    return function() {
                        return documentMousetrap[method].apply(documentMousetrap, arguments);
                    };
                } (method));
            }
        }
    };

    Mousetrap.init();

    // expose mousetrap to the global object
    window.Mousetrap = Mousetrap;

    // expose as a common js module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Mousetrap;
    }

    // expose mousetrap as an AMD module
    if (true) {
        !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
            return Mousetrap;
        }.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
}) (typeof window !== 'undefined' ? window : null, typeof  window !== 'undefined' ? document : null);


/***/ }),

/***/ 339:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(17);
const effects_1 = __webpack_require__(12);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(8);
const stageSaga_1 = __webpack_require__(340);
const stages_1 = __webpack_require__(50);
function* animateTexts(textIds, { direction, distance: totalDistance, duration }) {
    const speed = totalDistance / duration;
    // 累计移动的距离
    let animatedDistance = 0;
    while (true) {
        const { delta } = yield effects_1.take('TICK');
        // 本次TICK中可以移动的距离
        const len = delta * speed;
        const distance = len + animatedDistance < totalDistance ? len : totalDistance - animatedDistance;
        yield effects_1.put({
            type: 'UPDATE_TEXT_POSITION',
            textIds,
            direction,
            distance,
        });
        animatedDistance += distance;
        if (animatedDistance >= totalDistance) {
            return;
        }
    }
}
// 播放游戏结束的动画
function* animateGameover() {
    const textId1 = common_1.getNextId('text');
    const textId2 = common_1.getNextId('text');
    yield effects_1.put({
        type: 'SET_TEXT',
        textId: textId1,
        content: 'game',
        fill: 'red',
        x: constants_1.BLOCK_SIZE * 6.5,
        y: constants_1.BLOCK_SIZE * 13,
    });
    yield effects_1.put({
        type: 'SET_TEXT',
        textId: textId2,
        content: 'over',
        fill: 'red',
        x: constants_1.BLOCK_SIZE * 6.5,
        y: constants_1.BLOCK_SIZE * 13.5,
    });
    yield* animateTexts([textId1, textId2], {
        direction: 'up',
        distance: constants_1.BLOCK_SIZE * 6,
        duration: 2000,
    });
    yield redux_saga_1.delay(500);
    yield effects_1.put({ type: 'REMOVE_TEXT', textId: textId1 });
    yield effects_1.put({ type: 'REMOVE_TEXT', textId: textId2 });
    yield effects_1.put({ type: 'LOAD_SCENE', scene: 'gameover' });
}
/**
 *  game-saga负责管理整体游戏进度
 *  负责管理游戏开始界面, 游戏结束界面, 游戏暂停
 *  game-stage调用stage-saga来运行不同的关卡
 *  并根据stage-saga返回的结果选择继续下一个关卡, 或是选择游戏结束
 */
function* gameManager() {
    yield effects_1.take((action) => action.type === 'GAMESTART');
    console.log('gamestart');
    const stages = Object.keys(stages_1.default);
    for (const stageName of stages) {
        const stageResult = yield* stageSaga_1.default(stageName);
        if (stageResult.status === 'clear') {
            // continue to next stage
        }
        else {
            console.log(`gameover, reason: ${stageResult.reason}`);
            yield* animateGameover();
        }
    }
    // clear all stages
    // yield* animateClearance()
}
exports.default = gameManager;


/***/ }),

/***/ 340:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const _ = __webpack_require__(22);
const immutable_1 = __webpack_require__(5);
const redux_saga_1 = __webpack_require__(17);
const effects_1 = __webpack_require__(12);
const selectors = __webpack_require__(33);
const common_1 = __webpack_require__(8);
const types_1 = __webpack_require__(9);
const log = console.log;
const tankLevels = ['basic', 'fast', 'power', 'armor'];
function* statistics() {
    yield effects_1.put({ type: 'LOAD_SCENE', scene: 'statistics' });
    const { game: { killInfo } } = yield effects_1.select();
    const player1KillInfo = killInfo.get('player-1', immutable_1.Map());
    // todo 目前只考虑player-1的信息
    yield redux_saga_1.delay(500);
    for (const tankLevel of tankLevels) {
        const { game: { transientKillInfo } } = yield effects_1.select();
        yield redux_saga_1.delay(250);
        const levelKillCount = player1KillInfo.get(tankLevel, 0);
        if (levelKillCount === 0) {
            yield effects_1.put({
                type: 'UPDATE_TRANSIENT_KILL_INFO',
                info: transientKillInfo.setIn(['player-1', tankLevel], 0),
            });
        }
        else {
            for (let count = 1; count <= levelKillCount; count += 1) {
                yield effects_1.put({
                    type: 'UPDATE_TRANSIENT_KILL_INFO',
                    info: transientKillInfo.setIn(['player-1', tankLevel], count),
                });
                yield redux_saga_1.delay(160);
            }
        }
        yield redux_saga_1.delay(300);
    }
    yield redux_saga_1.delay(1000);
    yield effects_1.put({ type: 'SHOW_TOTAL_KILL_COUNT' });
    yield redux_saga_1.delay(3000);
}
function* powerUp(powerUp) {
    const pickThisPowerUp = (action) => (action.type === 'PICK_POWER_UP' && action.powerUp.powerUpId === powerUp.powerUpId);
    try {
        yield effects_1.put({
            type: 'ADD_POWER_UP',
            powerUp,
        });
        let visible = true;
        for (let i = 0; i < 50; i++) {
            const result = yield effects_1.race({
                timeout: redux_saga_1.delay(200),
                picked: effects_1.take(pickThisPowerUp),
                stageChanged: effects_1.take('LOAD_STAGE'),
            });
            if (result.picked || result.stageChanged) {
                break;
            } // else timeout. continue
            visible = !visible;
            yield effects_1.put({
                type: 'UPDATE_POWER_UP',
                powerUp: powerUp.set('visible', visible),
            });
        }
    }
    finally {
        yield effects_1.put({
            type: 'REMOVE_POWER_UP',
            powerUpId: powerUp.powerUpId,
        });
    }
}
/**
 * stage-saga的一个实例对应一个关卡
 * 在关卡开始时, 一个stage-saga实例将会启动, 负责关卡地图生成
 * 在关卡过程中, 该saga负责统计该关卡中的战斗信息
 * 当玩家清空关卡时stage-saga退出, 并向game-saga返回该关卡相关信息
 */
function* stageSaga(stageName) {
    yield effects_1.put({ type: 'LOAD_SCENE', scene: 'game' });
    yield effects_1.put({ type: 'LOAD_STAGE', name: stageName });
    while (true) {
        const { sourcePlayer, targetTank } = yield effects_1.take('KILL');
        const { players, game: { remainingEnemies }, tanks } = yield effects_1.select();
        if (sourcePlayer.side === 'human') {
            // 对human player的击杀信息进行统计
            yield effects_1.put({
                type: 'INC_KILL_COUNT',
                playerName: sourcePlayer.playerName,
                level: targetTank.level,
            });
            // 处理powerup
            if (true) {
                const powerUpName = _.sample(['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel']);
                const position = _.sample(yield effects_1.select(selectors.validPowerUpSpawnPositions));
                yield effects_1.fork(powerUp, types_1.PowerUpRecord({
                    powerUpId: common_1.getNextId('power-up'),
                    powerUpName,
                    visible: true,
                    x: position.x,
                    y: position.y,
                }));
            }
            const activeAITanks = tanks.filter(t => (t.active && t.side === 'ai'));
            if (remainingEnemies.isEmpty() && activeAITanks.isEmpty()) {
                // 剩余enemy数量为0, 且场上已经没有ai tank了
                // todo 如果场上有powerup, 则delay时间可以适当延长; 如果场上没有power, 则delay时间可以缩短
                yield redux_saga_1.delay(6000);
                yield* statistics();
                return { status: 'clear' };
            }
        }
        else {
            if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
                // 所有的human player都挂了
                yield redux_saga_1.delay(2000);
                yield* statistics();
                return { status: 'fail', reason: 'all-human-dead' };
            }
        }
    }
}
exports.default = stageSaga;


/***/ }),

/***/ 341:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(17);
const effects_1 = __webpack_require__(12);
const common_1 = __webpack_require__(8);
const directionController_1 = __webpack_require__(149);
const fireController_1 = __webpack_require__(150);
const common_2 = __webpack_require__(8);
const selectors = __webpack_require__(33);
const types_1 = __webpack_require__(9);
const AIWorker = __webpack_require__(342);
function* handleCommands(playerName, commandChannel, noteChannel) {
    let fire = false;
    let nextDirection = null;
    let forwardLength = 0;
    let startPos;
    yield effects_1.fork(directionController_1.default, playerName, getAIInput);
    yield effects_1.fork(fireController_1.default, playerName, () => {
        if (fire) {
            fire = false;
            return true;
        }
        else {
            return false;
        }
    });
    yield effects_1.fork(function* notifyWhenBulletComplete() {
        while (true) {
            const { bullets } = yield effects_1.take('DESTROY_BULLETS');
            const tank = yield effects_1.select(selectors.playerTank, playerName);
            if (tank != null) {
                if (bullets.some(b => (b.tankId === tank.tankId))) {
                    console.debug('bullet-completed. notify');
                    noteChannel.put({ type: 'bullet-complete' });
                }
            }
        }
    });
    while (true) {
        const command = yield effects_1.take(commandChannel);
        if (command.type === 'forward') {
            const tank = yield effects_1.select(selectors.playerTank, playerName);
            if (tank == null) {
                continue;
            }
            const { xy } = common_1.getDirectionInfo(tank.direction);
            startPos = tank.get(xy);
            forwardLength = command.forwardLength;
        }
        else if (command.type === 'fire') {
            fire = true;
        }
        else if (command.type === 'turn') {
            nextDirection = command.direction;
        }
        else if (command.type === 'query') {
            if (command.query === 'my-tank-info') {
                const tank = yield effects_1.select(selectors.playerTank, playerName);
                if (tank == null) {
                    continue;
                }
                noteChannel.put({
                    type: 'query-result',
                    result: {
                        type: 'my-tank-info',
                        tank: tank && tank.toObject(),
                    },
                });
            }
            else if (command.query === 'map-info') {
                const { map } = yield effects_1.select();
                noteChannel.put({
                    type: 'query-result',
                    result: { type: 'map-info', map: map.toJS() },
                });
            }
            else if (command.query === 'active-tanks-info') {
                const { tanks } = yield effects_1.select();
                noteChannel.put({
                    type: 'query-result',
                    result: {
                        type: 'active-tanks-info',
                        tanks: tanks.filter(t => t.active).map(t => t.toObject()).toArray(),
                    },
                });
            }
            else if (command.query === 'my-fire-info') {
                const tank = yield effects_1.select(selectors.playerTank, playerName);
                if (tank == null) {
                    continue;
                }
                const { bullets } = yield effects_1.select();
                const bulletCount = bullets.filter(b => b.tankId === tank.tankId).count();
                const canFire = bulletCount < common_2.getTankBulletLimit(tank) && tank.cooldown <= 0;
                noteChannel.put({
                    type: 'query-result',
                    result: {
                        type: 'my-fire-info',
                        bulletCount,
                        canFire,
                        cooldown: tank.cooldown,
                    },
                });
            }
        }
        else {
            throw new Error();
        }
    }
    function* getAIInput() {
        const tank = yield effects_1.select(selectors.playerTank, playerName);
        if (tank == null) {
            return null;
        }
        // fixme 转向的时候会将当前前进的信息清除, 导致转向命令和前进命令不能共存
        if (nextDirection && tank.direction !== nextDirection) {
            const direction = nextDirection;
            nextDirection = null;
            forwardLength = 0;
            return { type: 'turn', direction };
        }
        else if (forwardLength > 0) {
            const { xy } = common_1.getDirectionInfo(tank.direction);
            const movedLength = Math.abs(tank.get(xy) - startPos);
            const maxDistance = forwardLength - movedLength;
            if (movedLength === forwardLength) {
                forwardLength = 0;
                noteChannel.put({ type: 'reach' });
                return null;
            }
            else {
                return {
                    type: 'forward',
                    maxDistance,
                };
            }
        }
        return null;
    }
}
function* sendNotes(worker, noteChannel) {
    yield effects_1.fork(function* sendNote() {
        while (true) {
            const note = yield effects_1.take(noteChannel);
            worker.postMessage(note);
        }
    });
}
/**
 * AIWorkerSaga对应一个正在游戏中的AI玩家.
 * 当一个AI玩家坦克创建/激活时, 一个AIWorkerSaga实例将被创建
 * 当AI玩家的坦克被击毁时, saga实例将停止运行
 * 一个AIWorkerSaga实例总是对应一个正在游戏中的AI玩家坦克
 *
 * 在创建AiWorkerSaga的过程中, 将创建worker对象,
 * 并将创建noteChannel和commandChannel
 * 游戏逻辑和AI逻辑使用这两个channel来进行数据交换
 */
function* AIWorkerSaga(playerName, WorkerClass) {
    const worker = new WorkerClass();
    try {
        // noteChannel用来向AI程序发送消息/通知
        const noteChannel = redux_saga_1.channel();
        // commandChannel用来从AI程序获取command
        const commandChannel = redux_saga_1.eventChannel((emitter) => {
            const listener = (event) => emitter(event.data);
            worker.addEventListener('message', listener);
            return () => worker.removeEventListener('message', listener);
        });
        yield effects_1.all([
            handleCommands(playerName, commandChannel, noteChannel),
            sendNotes(worker, noteChannel),
        ]);
    }
    finally {
        worker.terminate();
    }
}
/** AIMasterSaga用来管理AIWorkerSaga的启动和停止, 并处理和AI程序的数据交互 */
function* AIMasterSaga() {
    const max = 2;
    const taskMap = {};
    const addAICommandChannel = redux_saga_1.channel();
    yield effects_1.fork(addAIHandler);
    while (true) {
        const actionTypes = ['KILL', 'LOAD_STAGE', 'GAMEOVER'];
        const action = yield effects_1.take(actionTypes);
        if (action.type === 'LOAD_STAGE') {
            for (let i = 0; i < max; i++) {
                addAICommandChannel.put('add');
            }
        }
        else if (action.type === 'KILL' && action.targetTank.side === 'ai') {
            const { targetPlayer: { playerName } } = action;
            // ai-player的坦克被击毁了
            const task = taskMap[playerName];
            task.cancel();
            delete taskMap[action.targetPlayer.playerName];
            yield effects_1.put({ type: 'REMOVE_PLAYER', playerName });
            addAICommandChannel.put('add');
        }
        else if (action.type === 'GAMEOVER') {
            // 游戏结束时, 取消所有的ai-player // todo 这里有bug
            for (const [playerName, task] of Object.entries(taskMap)) {
                task.cancel();
                delete taskMap[playerName];
                yield effects_1.put({ type: 'REMOVE_PLAYER', playerName });
            }
        }
    }
    function* addAIHandler() {
        while (true) {
            yield effects_1.take(addAICommandChannel);
            const { game: { remainingEnemies } } = yield effects_1.select();
            if (!remainingEnemies.isEmpty()) {
                const playerName = `AI-${common_2.getNextId('AI-player')}`;
                yield effects_1.put({
                    type: 'CREATE_PLAYER',
                    player: types_1.PlayerRecord({
                        playerName,
                        lives: Infinity,
                        side: 'ai',
                    }),
                });
                const { x, y } = yield effects_1.select(selectors.availableSpawnPosition);
                yield effects_1.put({ type: 'REMOVE_FIRST_REMAINING_ENEMY' });
                const level = remainingEnemies.first();
                const hp = level === 'armor' ? 4 : 1;
                const tankId = yield* common_1.spawnTank(types_1.TankRecord({
                    x,
                    y,
                    side: 'ai',
                    level,
                    hp,
                }));
                taskMap[playerName] = yield effects_1.spawn(AIWorkerSaga, playerName, AIWorker);
                yield effects_1.put({
                    type: 'ACTIVATE_PLAYER',
                    playerName,
                    tankId,
                });
            }
        }
    }
}
exports.default = AIMasterSaga;


/***/ }),

/***/ 342:
/***/ (function(module, exports, __webpack_require__) {

module.exports = function() {
	return new Worker(__webpack_require__.p + "1258cdcfdcb3bc2388a7.worker.js");
};

/***/ }),

/***/ 343:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(17);
const effects_1 = __webpack_require__(12);
const constants_1 = __webpack_require__(2);
const TankRecord_1 = __webpack_require__(142);
const common_1 = __webpack_require__(8);
const selectors = __webpack_require__(33);
const PlayerRecord_1 = __webpack_require__(143);
function* handlePickPowerUps(playerName) {
    while (true) {
        yield effects_1.take('AFTER_TICK');
        const tank = yield effects_1.select(selectors.playerTank, playerName);
        if (tank == null) {
            continue;
        }
        const { powerUps, players } = yield effects_1.select();
        const powerUp = powerUps.find(p => common_1.testCollide(common_1.asBox(p, -0.5), common_1.asBox(tank)));
        if (powerUp) {
            yield effects_1.put({
                type: 'PICK_POWER_UP',
                tank,
                powerUp,
                player: players.get(playerName),
            });
        }
    }
}
function* humanPlayerSaga(playerName, tankColor) {
    yield effects_1.fork(handlePickPowerUps, playerName);
    yield effects_1.put({
        type: 'CREATE_PLAYER',
        player: PlayerRecord_1.default({
            playerName,
            lives: 3,
            side: 'human',
        }),
    });
    while (true) {
        yield effects_1.take((action) => (action.type === 'LOAD_STAGE'
            || action.type === 'KILL' && action.targetPlayer.playerName === playerName));
        const { players } = yield effects_1.select();
        const player = players.get(playerName);
        if (player.lives > 0) {
            yield redux_saga_1.delay(500);
            yield effects_1.put({ type: 'DECREMENT_PLAYER_LIFE', playerName });
            const tankId = yield* common_1.spawnTank(TankRecord_1.default({
                x: 4 * constants_1.BLOCK_SIZE,
                y: 12 * constants_1.BLOCK_SIZE,
                side: 'human',
                color: tankColor,
                level: 'basic',
            }));
            yield effects_1.put({
                type: 'ACTIVATE_PLAYER',
                playerName,
                tankId,
            });
        }
    }
}
exports.default = humanPlayerSaga;


/***/ }),

/***/ 344:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(17);
const effects_1 = __webpack_require__(12);
const types_1 = __webpack_require__(9);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(8);
const bulletsSaga_1 = __webpack_require__(151);
function convertToBricks(map) {
    const { eagle, steels, bricks } = map;
    const eagleSurroundingBox = {
        x: eagle.x - 8,
        y: eagle.y - 8,
        width: 32 - 1,
        height: 32 - 1,
    };
    const btset = new Set(Array.from(common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
        .map(([brow, bcol]) => brow * constants_1.N_MAP.BRICK + bcol));
    const eagleBTSet = new Set(Array.from(common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, common_1.asBox(eagle, -0.1)))
        .map(([brow, bcol]) => brow * constants_1.N_MAP.BRICK + bcol));
    const ttset = new Set(Array.from(common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
        .map(([brow, bcol]) => {
        const trow = Math.floor(brow / 2);
        const tcol = Math.floor(bcol / 2);
        return trow * constants_1.N_MAP.STEEL + tcol;
    }));
    const steels2 = steels.map((set, t) => (ttset.has(t) ? false : set));
    const bricks2 = bricks.map((set, t) => (btset.has(t) && !eagleBTSet.has(t) ? true : set));
    return map.set('steels', steels2).set('bricks', bricks2);
}
function convertToSteels(map) {
    const { eagle, steels, bricks } = map;
    const eagleSurroundingBox = {
        x: eagle.x - 8,
        y: eagle.y - 8,
        width: 32 - 1,
        height: 32 - 1,
    };
    const surroundingTTSet = new Set(Array.from(common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.STEEL, eagleSurroundingBox))
        .map(([trow, tcol]) => trow * constants_1.N_MAP.STEEL + tcol));
    const eagleTTSet = new Set(Array.from(common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.STEEL, common_1.asBox(eagle, -0.1)))
        .map(([trow, tcol]) => trow * constants_1.N_MAP.STEEL + tcol));
    const steels2 = steels.map((set, t) => ((surroundingTTSet.has(t) && !eagleTTSet.has(t)) ? true : set));
    const surroundBTSet = new Set(Array.from(common_1.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, eagleSurroundingBox))
        .map(([brow, bcol]) => brow * constants_1.N_MAP.BRICK + bcol));
    const bricks2 = bricks.map((set, t) => (surroundBTSet.has(t) ? false : set));
    return map.set('steels', steels2)
        .set('bricks', bricks2);
}
function* shovel() {
    yield effects_1.put({
        type: 'UPDATE_MAP',
        map: convertToSteels((yield effects_1.select()).map),
    });
    // shovel的有效时间
    yield redux_saga_1.delay(3e3);
    // 闪烁
    yield effects_1.put({
        type: 'UPDATE_MAP',
        map: convertToBricks((yield effects_1.select()).map),
    });
    for (let i = 0; i < 4; i++) {
        yield redux_saga_1.delay(200);
        yield effects_1.put({
            type: 'UPDATE_MAP',
            map: convertToSteels((yield effects_1.select()).map),
        });
        yield redux_saga_1.delay(200);
        yield effects_1.put({
            type: 'UPDATE_MAP',
            map: convertToBricks((yield effects_1.select()).map),
        });
    }
}
function* timer() {
    yield effects_1.put({
        type: 'SET_AI_FROZEN_TIMEOUT',
        AIFrozenTimeout: 5e3,
    });
    while (true) {
        const { delta } = yield effects_1.take('TICK');
        const { game: { AIFrozenTimeout } } = yield effects_1.select();
        if (AIFrozenTimeout === 0) {
            break;
        }
        const next = AIFrozenTimeout - delta;
        yield effects_1.put({
            type: 'SET_AI_FROZEN_TIMEOUT',
            AIFrozenTimeout: next <= 0 ? 0 : next,
        });
    }
}
function* grenade(action) {
    const { tanks, players } = yield effects_1.select();
    const activeAITanks = tanks.filter(t => (t.active && t.side === 'ai'));
    const aiTankIdSet = activeAITanks.map(t => t.tankId).toSet();
    yield* bulletsSaga_1.destroyTanks(aiTankIdSet);
    // todo 确定需要put KILL?
    yield* activeAITanks.map(targetTank => effects_1.put({
        type: 'KILL',
        sourcePlayer: action.player,
        sourceTank: action.tank,
        targetPlayer: players.find(p => p.activeTankId === targetTank.tankId),
        targetTank,
    })).values();
}
function* star({ tank }) {
    yield effects_1.put({ type: 'UPGRADE_TANK', tankId: tank.tankId });
}
function* tank({ player }) {
    yield effects_1.put({ type: 'INCREMENT_PLAYER_LIFE', playerName: player.playerName });
}
function* helmet({ tank }) {
    yield effects_1.put({
        type: 'SET_HELMET_DURATION',
        tankId: tank.tankId,
        duration: 6e3,
    });
}
const is = (name) => (action) => (action.type === 'PICK_POWER_UP'
    && action.powerUp.powerUpName === name);
function* handleHelmetDuration() {
    while (true) {
        const { delta } = yield effects_1.take('TICK');
        const { tanks } = yield effects_1.select();
        yield* tanks.filter(tank => (tank.active && tank.helmetDuration > 0))
            .map(tank => effects_1.put({
            type: 'SET_HELMET_DURATION',
            tankId: tank.tankId,
            duration: tank.helmetDuration - delta,
        }))
            .values();
    }
}
function* showScoreWhenPickPowerUp(action) {
    const { powerUp: { x, y } } = action;
    const scoreId = common_1.getNextId('score');
    yield effects_1.put({
        type: 'ADD_SCORE',
        score: types_1.ScoreRecord({
            scoreId,
            score: 500,
            x,
            y,
        }),
    });
}
function* powerUps() {
    yield effects_1.takeEvery('PICK_POWER_UP', showScoreWhenPickPowerUp);
    yield effects_1.takeLatest(is('shovel'), shovel);
    yield effects_1.takeLatest(is('timer'), timer);
    yield effects_1.takeEvery(is('grenade'), grenade);
    yield effects_1.takeEvery(is('star'), star);
    yield effects_1.takeEvery(is('tank'), tank);
    yield effects_1.takeEvery(is('helmet'), helmet);
    yield effects_1.fork(handleHelmetDuration);
}
exports.default = powerUps;


/***/ }),

/***/ 345:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const constants_1 = __webpack_require__(2);
const GameScene_1 = __webpack_require__(346);
const GameoverScene_1 = __webpack_require__(91);
const StatisticsScene_1 = __webpack_require__(92);
const GameTitleScene_1 = __webpack_require__(93);
let Inspector = () => (React.createElement("div", { style: { maxWidth: 200, marginLeft: 20 } },
    React.createElement("p", null, "\u6E38\u620F\u4ECD\u5728\u5F00\u53D1\u4E2D\uFF0C\u76EE\u524D\u53EA\u652F\u6301\u5355\u4EBA\u8FDB\u884C\u6E38\u620F\u3002 \u76EE\u524D\u6E38\u620F\u4ECD\u6709\u5F88\u591ABUG\uFF0C\u8BF7\u89C1\u8C05\u3002 \u8BF7\u4F7F\u7528\u6700\u65B0\u7684chrome\u6D4F\u89C8\u5668\u3002 \u6E38\u620F\u5F00\u59CB\u9875\u9762\u8BF7\u4F7F\u7528\u9F20\u6807\u8FDB\u884C\u64CD\u4F5C\u3002 \u6574\u4E2A\u6E38\u620F\u90FD\u4F7F\u7528\u4E86\u77E2\u91CF\u56FE\uFF0C\u53EF\u4EE5\u9002\u5F53\u653E\u5927\u6D4F\u89C8\u5668\u7684\u7F29\u653E\u6BD4\u4F8B\u3002"),
    React.createElement("p", null, "WASD \u63A7\u5236\u5766\u514B\u65B9\u5411"),
    React.createElement("p", null, "J \u63A7\u5236\u5F00\u706B"),
    React.createElement("p", null,
        "\u4F7F\u7528",
        React.createElement("a", { href: "./editor.html", target: "_blank" }, "\u7F16\u8F91\u5668"),
        "\u521B\u5EFA\u81EA\u5DF1\u559C\u6B22\u7684\u5730\u56FE"),
    React.createElement("p", null,
        "\u5728",
        React.createElement("a", { href: "./stories.html", target: "_blank" }, "stories\u9875\u9762"),
        "\u6D4F\u89C8\u6E38\u620F\u4E2D\u7684\u7EC4\u4EF6/\u7D20\u6750"),
    React.createElement("p", null,
        "STAR ME ON ",
        React.createElement("a", { href: "https://github.com/shinima/battle-city" }, "GitHub"))));
if (false) {
    Inspector = require('components/Inspector').default;
}
const zoomLevel = 2;
const totalWidth = 16 * constants_1.BLOCK_SIZE;
const totalHeight = 15 * constants_1.BLOCK_SIZE;
class App extends React.PureComponent {
    render() {
        const { scene } = this.props;
        return (React.createElement("div", { style: { display: 'flex' } },
            React.createElement("svg", { className: "svg", style: { background: '#757575' }, width: totalWidth * zoomLevel, height: totalHeight * zoomLevel, viewBox: `0 0 ${totalWidth} ${totalHeight}` },
                scene === 'game-title' ? React.createElement(GameTitleScene_1.default, null) : null,
                scene === 'game' ? React.createElement(GameScene_1.default, null) : null,
                scene === 'gameover' ? React.createElement(GameoverScene_1.default, null) : null,
                scene === 'statistics' ? React.createElement(StatisticsScene_1.default, null) : null),
            React.createElement(Inspector, null)));
    }
}
function mapStateToProps(state) {
    return {
        scene: state.game.scene,
    };
}
exports.default = react_redux_1.connect(mapStateToProps)(App);


/***/ }),

/***/ 346:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const _ = __webpack_require__(22);
const constants_1 = __webpack_require__(2);
const tanks_1 = __webpack_require__(24);
const HUD_1 = __webpack_require__(77);
const Bullet_1 = __webpack_require__(80);
const BrickLayer_1 = __webpack_require__(81);
const SteelLayer_1 = __webpack_require__(82);
const RiverLayer_1 = __webpack_require__(83);
const SnowLayer_1 = __webpack_require__(84);
const ForestLayer_1 = __webpack_require__(85);
const Eagle_1 = __webpack_require__(86);
const Explosion_1 = __webpack_require__(87);
const Flicker_1 = __webpack_require__(88);
const TankHelmet_1 = __webpack_require__(350);
const TextLayer_1 = __webpack_require__(351);
const PowerUp_1 = __webpack_require__(89);
const Score_1 = __webpack_require__(90);
class GameScene extends React.Component {
    render() {
        const { bullets, map, explosions, flickers, tanks, texts, powerUps, scores } = this.props;
        const { bricks, steels, rivers, snows, forests, eagle } = map.toObject();
        const activeTanks = tanks.filter(t => t.active);
        return (React.createElement("g", { role: "game-scene" },
            React.createElement(HUD_1.default, null),
            React.createElement("g", { role: "battle-field", transform: `translate(${constants_1.BLOCK_SIZE},${constants_1.BLOCK_SIZE})` },
                React.createElement("rect", { width: 13 * constants_1.BLOCK_SIZE, height: 13 * constants_1.BLOCK_SIZE, fill: "#000000" }),
                React.createElement(RiverLayer_1.default, { rivers: rivers }),
                React.createElement(SteelLayer_1.default, { steels: steels }),
                React.createElement(BrickLayer_1.default, { bricks: bricks }),
                React.createElement(SnowLayer_1.default, { snows: snows }),
                React.createElement(Eagle_1.default, { x: eagle.x, y: eagle.y, broken: eagle.broken }),
                React.createElement("g", { role: "bullet-layer" }, bullets.map((b, i) => React.createElement(Bullet_1.default, { key: i, direction: b.direction, x: b.x, y: b.y })).toArray()),
                React.createElement("g", { role: "tank-layer" }, activeTanks.map(tank => React.createElement(tanks_1.Tank, { key: tank.tankId, tank: tank })).toArray()),
                React.createElement("g", { role: "helmet-layer" }, activeTanks.map(tank => tank.helmetDuration > 0 ? (React.createElement(TankHelmet_1.default, { key: tank.tankId, x: tank.x, y: tank.y })) : null).toArray()),
                React.createElement(ForestLayer_1.default, { forests: forests }),
                React.createElement("g", { role: "power-up-layer" }, powerUps.map(powerUp => React.createElement(PowerUp_1.default, { key: powerUp.powerUpId, powerUp: powerUp })).toArray()),
                React.createElement("g", { role: "explosion-layer" }, explosions.map(exp => React.createElement(Explosion_1.default, { key: exp.explosionId, explosionType: exp.explosionType, x: exp.x, y: exp.y })).toArray()),
                React.createElement("g", { role: "flicker-layer" }, flickers.map(flicker => React.createElement(Flicker_1.default, { key: flicker.flickerId, x: flicker.x, y: flicker.y })).toArray()),
                React.createElement("g", { role: "score-layer" }, scores.map(s => React.createElement(Score_1.default, { key: s.scoreId, score: s.score, x: s.x, y: s.y })).toArray())),
            React.createElement(TextLayer_1.default, { texts: texts })));
    }
}
exports.default = react_redux_1.connect(_.identity)(GameScene);


/***/ }),

/***/ 350:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const registerTick_1 = __webpack_require__(25);
class TankHelmet extends React.PureComponent {
    render() {
        const { x, y, tickIndex } = this.props;
        const ds = [
            'M0,8 v-2 h1 v-1 h1 v-1 h2 v-2 h1 v-1 h1 v-1 h2 v1 h-2 v1 h-1 v2 h-1 v1 h-2 v1 h-1 v2 h-1',
            'M0,2 h1 v-1 h1 v-1 h2 v1 h1 v1 h2 v1 h1 v1 h-1 v-1 h-2 v-1 h-1 v-1 h-2 v1 h-1 v2 h1 v1 h1 v2 h1 v1 h-1 v-1 h-1 v-2 h-1 v-1 h-1 v-2',
        ];
        return (React.createElement("g", { role: "tank-helmet", transform: `translate(${x}, ${y})`, fill: "white" },
            React.createElement("path", { d: ds[tickIndex] }),
            React.createElement("path", { transform: "rotate(90)", style: { transformOrigin: 'right bottom' }, d: ds[tickIndex] }),
            React.createElement("path", { transform: "rotate(180)", style: { transformOrigin: 'right bottom' }, d: ds[tickIndex] }),
            React.createElement("path", { transform: "rotate(270)", style: { transformOrigin: 'right bottom' }, d: ds[tickIndex] })));
    }
}
exports.default = registerTick_1.default(70, 70)(TankHelmet);


/***/ }),

/***/ 351:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const Text_1 = __webpack_require__(13);
class TextLayer extends React.PureComponent {
    render() {
        const { texts } = this.props;
        return (React.createElement("g", { role: "text-layer" }, texts.map(t => React.createElement(Text_1.default, { key: t.textId, content: t.content, fill: t.fill, x: t.x, y: t.y })).toArray()));
    }
}
exports.default = TextLayer;


/***/ }),

/***/ 77:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const EnemyCountIndicator_1 = __webpack_require__(78);
const icons_1 = __webpack_require__(79);
const Text_1 = __webpack_require__(13);
const constants_1 = __webpack_require__(2);
function mapStateToProps(state) {
    return {
        remainingEnemyCount: state.game.remainingEnemies.size,
        players: state.players,
    };
}
class HUD extends React.PureComponent {
    renderPlayer1Info() {
        const { players } = this.props;
        const player1 = players.find(p => (p.playerName === 'player-1'));
        if (player1 == null) {
            return null;
        }
        else {
            const transform = `translate(${14.5 * constants_1.BLOCK_SIZE},${7.5 * constants_1.BLOCK_SIZE})`;
            return (React.createElement("g", { role: "player-1-info", transform: transform },
                React.createElement(Text_1.default, { x: 0, y: 0, content: '\u2160P', fill: "#000000" }),
                React.createElement(icons_1.PlayerTankThumbnail, { x: 0, y: 0.5 * constants_1.BLOCK_SIZE }),
                React.createElement(Text_1.default, { x: 0.5 * constants_1.BLOCK_SIZE, y: 0.5 * constants_1.BLOCK_SIZE, content: String(player1.lives), fill: "#000000" })));
        }
    }
    renderPlayer2Info() {
        const { players } = this.props;
        const player2 = players.find(p => (p.playerName === 'player-2'));
        if (player2 == null) {
            return null;
        }
        else {
            const transform = `translate(${14.5 * constants_1.BLOCK_SIZE},${8.5 * constants_1.BLOCK_SIZE})`;
            return (React.createElement("g", { role: "player-2-info", transform: transform },
                React.createElement(Text_1.default, { x: 0, y: 0, content: '\u2161P', fill: "#000000" }),
                React.createElement(icons_1.PlayerTankThumbnail, { x: 0, y: 0.5 * constants_1.BLOCK_SIZE }),
                React.createElement(Text_1.default, { x: 0.5 * constants_1.BLOCK_SIZE, y: 0.5 * constants_1.BLOCK_SIZE, content: String(player2.lives), fill: "#000000" })));
        }
    }
    render() {
        const { remainingEnemyCount } = this.props;
        return (React.createElement("g", { role: "HUD" },
            React.createElement(EnemyCountIndicator_1.default, { count: remainingEnemyCount }),
            this.renderPlayer1Info(),
            this.renderPlayer2Info()));
    }
}
exports.default = react_redux_1.connect(mapStateToProps)(HUD);


/***/ }),

/***/ 78:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const _ = __webpack_require__(22);
const constants_1 = __webpack_require__(2);
// <EnemyTankThumbnail />的尺寸为 8 * 8
const EnemyTankThumbnail = ({ x, y }) => (React.createElement("g", { transform: `translate(${x},${y})`, fill: "#00000" },
    React.createElement("rect", { x: 1, y: 1, width: 1, height: 6 }),
    React.createElement("rect", { x: 7, y: 1, width: 1, height: 6 }),
    React.createElement("rect", { x: 2, y: 3, width: 5, height: 2 }),
    React.createElement("rect", { x: 3, y: 2, width: 3, height: 4 }),
    React.createElement("rect", { x: 4, y: 1, width: 1, height: 6 }),
    React.createElement("rect", { x: 3, y: 7, width: 3, height: 1 }),
    React.createElement("rect", { x: 4, y: 3, width: 1, height: 2, fill: "#6B0800" })));
const transform = `translate(${1.5 * constants_1.BLOCK_SIZE + constants_1.FIELD_SIZE}, ${1.5 * constants_1.BLOCK_SIZE})`;
class EnemyCountIndicator extends React.PureComponent {
    render() {
        const { count } = this.props;
        return (React.createElement("g", { role: "remaining-enemy-count-indicator", transform: transform }, _.range(count).map(t => React.createElement(EnemyTankThumbnail, { key: t, x: 8 * (t % 2), y: 8 * Math.floor(t / 2) }))));
    }
}
exports.default = EnemyCountIndicator;


/***/ }),

/***/ 79:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
class PlayerTankThumbnail extends React.PureComponent {
    render() {
        const { x, y } = this.props;
        return (React.createElement("path", { role: "player-tank-thumbnail", transform: `translate(${x},${y})`, fill: "#9c4a00", d: "M1,1 h1 v2 h1 v-1 h1 v-1 h-1 v-1 h3 v1 h-1 v1 h1 v1 h1 v-2 h1 v7 h-1 v-2 h-1 v-2 h-1 v-1 h-1 v1 h-1 v1 h1 v1 h1 v-1 h1 v2 h-1 v1 h-1 v-1 h-1 v-1 h-1 v2 h-1 v-7" }));
    }
}
exports.PlayerTankThumbnail = PlayerTankThumbnail;


/***/ }),

/***/ 80:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const elements_1 = __webpack_require__(18);
const fill = '#ADADAD';
const Bullet = ({ x, y, direction }) => {
    let head = null;
    if (direction === 'up') {
        head = React.createElement(elements_1.Pixel, { x: 1, y: -1, fill: fill });
    }
    else if (direction === 'down') {
        head = React.createElement(elements_1.Pixel, { x: 1, y: 3, fill: fill });
    }
    else if (direction === 'left') {
        head = React.createElement(elements_1.Pixel, { x: -1, y: 1, fill: fill });
    }
    else if (direction === 'right') {
        head = React.createElement(elements_1.Pixel, { x: 3, y: 1, fill: fill });
    }
    else {
        throw new Error(`Invalid direction ${direction}`);
    }
    return (React.createElement("g", { role: "bullet", transform: `translate(${x},${y})` },
        head,
        React.createElement("rect", { width: 3, height: 3, fill: fill })));
};
exports.default = Bullet;


/***/ }),

/***/ 87:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const elements_1 = __webpack_require__(18);
const registerTick_1 = __webpack_require__(25);
const schema = {
    ' ': 'none',
    W: '#fffffe',
    P: '#590d79',
    R: '#b53121',
};
const bulletExplosiondataArray = [
    [
        '                ',
        '                ',
        '       W     W  ',
        '   W   W  W W   ',
        '   PWW PW WWP   ',
        '    PPWWPPWP    ',
        '     PWRWRWPWW  ',
        '   WWWPWR RPP   ',
        '     PW RRWP    ',
        '     WWRWPRWP   ',
        '    WP WPWWPWP  ',
        '   WP PW PW  W  ',
        '      W   P     ',
        '                ',
        '                ',
    ],
    [
        '                ',
        '      P   W     ',
        ' W  P WP WP   W ',
        ' PWW  PW WP WWP ',
        '  PPWPPWWWPWPP  ',
        '   PWRWWWPRWW P ',
        ' P  PWR RWWPP   ',
        '   WWWWRRR PWWW ',
        'WW WPW RR WWPP  ',
        '  PPWWPRRRWPP P ',
        '    WRWP PWRW   ',
        '  P PWRWWWRPWW  ',
        '   PWPWPPWW PPW ',
        '   WPPWP PW   P ',
        '  WP  W P PP    ',
        '                ',
    ],
    [
        '    P P    P  P ',
        ' W   W  W P  WP ',
        ' PPWW  WW   WP  ',
        '  PPWPPWPP WWP  ',
        '   PRWWWWPWWPP P',
        ' W PWWRW WWRP   ',
        'WWWW WR  RWWWWWW',
        ' PPPWWPR RWPPP  ',
        '   PPP WR PPWW  ',
        ' WPPWWPW WRWPPW ',
        '  WWWRWPWPWW    ',
        ' PWPPWPWWPPWW P ',
        ' WP  P PWP PPW  ',
        'WP  P   W    PW ',
        '        W P   P ',
    ],
];
class BulletExplosionClass extends React.PureComponent {
    render() {
        const { x, y, tickIndex } = this.props;
        return (React.createElement(elements_1.Bitmap, { x: x, y: y, d: bulletExplosiondataArray[tickIndex], scheme: schema }));
    }
}
exports.BulletExplosionClass = BulletExplosionClass;
exports.BulletExplosion = registerTick_1.default(66, 66, 9999)(BulletExplosionClass);
const tankExplosionDataArray = [
    [
        '                                ',
        '                     W       W  ',
        '  W       W          W       W  ',
        '   W  W  W   PPP WWP  W     W   ',
        '    P  W   WWWPPPWWPP W W  P    ',
        '     W P  WPWWW W  WPPW W WW    ',
        '      W   WWPW WPPP WWWW W      ',
        '    WW   WWWWWWWWWPWWWWWW W     ',
        '       PPPW  WWWPWWPWW PW    PW ',
        '      WPPPWWWWWPWW WW WWPW   W  ',
        'P    WW WPWWWRWWRWWWPWWWPWWW    ',
        ' WP PW WWWRRWWWWRPWWWPWPW WPW   ',
        '  W WW WWWWRRWRWRWWRRPWW WPPW   ',
        ' W   WW WPWRWRRRRRRWRWWWW WW    ',
        '  W WPWWPPWWRWRWWRWRPWWWWW WW   ',
        '    PP PWPWWRRWP WRWWWW W WPP   ',
        '      WWPWRRRW WPW RW PWWW PP   ',
        '     WWWWWWWRRWRPRRRWPPPWWWP  W ',
        '     WW WWWWRWRRPRWWRWW WWPP   W',
        '    PW WWPWRWWWRWRPWWWWWPPPP    ',
        '    PPWPPPWWWWPRRWWWWPWWW P W   ',
        '  W  PPPPWWWWPPWRWWWWWPWW WW    ',
        '   W    PW WPPWWWW WW PW WP     ',
        '        WW WWW WWWW  PPWWPP     ',
        '      WP WW W PPWWWWPPWW P      ',
        '     P W WWWWWPP  PPP W W WW    ',
        '    W      PPPP         W  P    ',
        '   W     W        W  W     WP   ',
        '  P        W       PWP      WP  ',
        '  W                W W       W  ',
        '                                ',
        '                                ',
    ],
    [
        'W                               ',
        'PW   W             PPWW       W ',
        ' PW   P     WPPP PWWWWPP    WP  ',
        '  PP    WW WWWP PWWW  WPP  WP   ',
        '   PP  WPWWWRWWW WW WP WPP  P   ',
        '   P  WWPPRPWWWWWWWWWWP WP      ',
        '      WPWWWWPWWWWWWPPWW WP WW   ',
        '    PPWWWWWWWWWPPWWWWPWWWPPWWP  ',
        '    PWWWW WPPWWWWPWWWWWWPPWWPPP ',
        '     WW  WWWWWRWWWWRWWWWPWW WPP ',
        '   WWW WWWRWWWRRWWRRWRWPWWWW WP ',
        '  PWWWWWWWRRRWRWRRRWRWWWWPWW WPW',
        '  WPWW WWWR RRWPRRWRWWWWWPW WPPP',
        '   PW PWWWWRWWR RWRWWWRWPW WPPW ',
        '   PP PWWWWRRRRWPRRRWRWWWWWWP   ',
        ' W WWW PWRRRRRWWW WRWWWWWWPPWW  ',
        ' WWWWWWWWWWRRP WWRRRRWWWWPWWWPP ',
        'WWWRPWWWWRWRWWRPWWR WRRRWWWWWWP ',
        'WWWWPWWWRWWRRRR RRWRWWWWWWW WWPW',
        'PWWPWRWWWWRRWRRWRRRRWWWWWPWW WWP',
        'PPPPWWPPWRRPPWRRRWWRRWWPPWWWW W ',
        ' PP WWWWWWWWWWRWWWWWWRWWWPWW WPW',
        '     WWWWWWWPWWWWWWPWWWWWWWWW WP',
        '    WW WW WWWWWWW PP WWWWWWWPWPW',
        '    WWW  PPWWWPWWW  WWWP WW  PWW',
        '    WWWWWWPPWWW WWWWPWWPP  WPPW ',
        '    PWWWWP WWWW WWWPPPWWPPPPPW  ',
        '  W  PWPP  PPPWW PPP WRWWPPW    ',
        '   W  PP      WWW   WWWPP    W  ',
        '  P P     WP   WWWWWWWPPW  P P  ',
        ' W  P       W   WWPPWPPP    P W ',
        'W          W     PPP P         P',
    ],
];
class TankExplosionClass extends React.PureComponent {
    render() {
        const { x, y, tickIndex } = this.props;
        return (React.createElement(elements_1.Bitmap, { x: x, y: y, d: tankExplosionDataArray[tickIndex], scheme: schema }));
    }
}
exports.TankExplosionClass = TankExplosionClass;
const TankExplosion = registerTick_1.default(200, 9999)(TankExplosionClass);
class Explosion extends React.PureComponent {
    render() {
        const _a = this.props, { explosionType } = _a, otherProps = __rest(_a, ["explosionType"]);
        if (explosionType === 'bullet') {
            return React.createElement(exports.BulletExplosion, Object.assign({}, otherProps));
        }
        else if (explosionType === 'tank') {
            return React.createElement(TankExplosion, Object.assign({}, otherProps));
        }
        else {
            return null;
        }
    }
}
exports.default = Explosion;


/***/ }),

/***/ 88:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const registerTick_1 = __webpack_require__(25);
const constants_1 = __webpack_require__(2);
const interval = constants_1.TANK_SPAWN_DELAY / 12;
class Flicker extends React.PureComponent {
    render() {
        const { x, y, tickIndex } = this.props;
        const transform = `translate(${x},${y})`;
        if (tickIndex === 0) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 3, y: 7, width: 9, height: 1 }),
                React.createElement("rect", { x: 6, y: 6, width: 3, height: 3 }),
                React.createElement("rect", { x: 7, y: 3, width: 1, height: 9 })));
        }
        else if (tickIndex === 1) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 2, y: 7, width: 11, height: 1 }),
                React.createElement("rect", { x: 5, y: 6, width: 5, height: 3 }),
                React.createElement("rect", { x: 6, y: 5, width: 3, height: 5 }),
                React.createElement("rect", { x: 7, y: 2, width: 1, height: 11 })));
        }
        else if (tickIndex === 2) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 1, y: 7, width: 13, height: 1 }),
                React.createElement("rect", { x: 4, y: 6, width: 7, height: 3 }),
                React.createElement("rect", { x: 6, y: 4, width: 3, height: 7 }),
                React.createElement("rect", { x: 7, y: 1, width: 1, height: 13 })));
        }
        else if (tickIndex === 3) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 0, y: 7, width: 15, height: 1 }),
                React.createElement("rect", { x: 3, y: 6, width: 9, height: 3 }),
                React.createElement("rect", { x: 5, y: 5, width: 5, height: 5 }),
                React.createElement("rect", { x: 6, y: 3, width: 3, height: 9 }),
                React.createElement("rect", { x: 7, y: 0, width: 1, height: 15 })));
        }
        else {
            throw new Error(`Invalid tickIndex: ${tickIndex}`);
        }
    }
}
exports.default = registerTick_1.default(interval, interval, interval, interval)(Flicker);


/***/ }),

/***/ 89:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const elements_1 = __webpack_require__(18);
const colorSchema = {
    ' ': 'none',
    w: '#FFFFFF',
    g: '#ADADAD',
    b: '#00424A',
};
const powerUpDataArray = {
    tank: [
        ' wwwwwwwwwwwwwg ',
        'w             wb',
        'w bbbbbbbbbbbbwb',
        'w bbbbbwgg bbbwb',
        'w bwwwwgggb bbwb',
        'w b    gggb bbwb',
        'w bbbwggbbgb bwb',
        'w bbwgggggbb bwb',
        'w bgbg      g wb',
        'w bggwwwwgggb wb',
        'w b w w w wbg wb',
        'w bb ggggggg bwb',
        'w bbb       bbwb',
        'gwwwwwwwwwwwwwwg',
        ' bbbbbbbbbbbbbb ',
        '                ',
    ],
    star: [
        ' wwwwwwwwwwwwwg ',
        'w             wb',
        'w bbbbbw bbbbbwb',
        'w bbbbwwg bbbbwb',
        'w bbbbwwg bbbbwb',
        'w wwwwwggwwww wb',
        'w bgggwgwggg  wb',
        'w bbgwwwwgg  wwb',
        'w bbwwggwwg bbwb',
        'w bgwgg ggwg bwb',
        'w bwgg   ggw bwb',
        'w bg   bb  g bwb',
        'w b  bbbbbb  bwb',
        'gwwwwwwwwwwwwwgb',
        ' bbbbbbbbbbbbbb ',
        '                ',
    ],
    grenade: [
        ' wwwwwwwwwwwwwg ',
        'w             wb',
        'w bbbwwwgg bbbwb',
        'w bbbwgb  g bbwb',
        'w bbwgggb  g bwb',
        'w bwgbwgbg g bwb',
        'w bg g  g  g bwb',
        'w bwgbwgbg g bwb',
        'w bg g  g  g bwb',
        'w bwgbwgbg g bwb',
        'w bbgb  g bbbbwb',
        'w bbbwgg bbbbbwb',
        'w bbb   bbbbbbwb',
        'gwwwwwwwwwwwwwgb',
        ' bbbbbbbbbbbbbb ',
        '                '
    ],
    timer: [
        ' wwwwwwwwwwwwwg ',
        'w             wb',
        'w bbbbwgwg bbbwb',
        'w bbbbg   wg bwb',
        'w bbbgggg    bwb',
        'w bbgwwwwg bbbwb',
        'w bgwwbwwwg bbwb',
        'w bgwwbwwwg bbwb',
        'w bgwwwbwwg bbwb',
        'w b gwwwwg bbbwb',
        'w bb gggg bbbbwb',
        'w bbb    bbbbbwb',
        'w bbbbbbbbbbbbwb',
        'gwwwwwwwwwwwwwgb',
        ' bbbbbbbbbbbbbb ',
        '                '
    ],
    helmet: [
        ' wwwwwwwwwwwwwg ',
        'w             wb',
        'w bbbbbbbbbbbbwb',
        'w bbbbbbbbbbbbwb',
        'w bbbwwwgg bbbwb',
        'w bbwwggggg bbwb',
        'w bbwgggggg bbwb',
        'w bbggggggg bbwb',
        'w bgggggggg bbwb',
        'w b     gggg bwb',
        'w bbbbbb     bwb',
        'w bbbbbbbbbbbbwb',
        'w bbbbbbbbbbbbwb',
        'gwwwwwwwwwwwwwgb',
        ' bbbbbbbbbbbbbb ',
        '                '
    ],
    shovel: [
        ' wwwwwwwwwwwwwg ',
        'w             wb',
        'w bbbbbbbbwbbbwb',
        'w bbbbbbbbwgbbwb',
        'w bbbbbbbbgggbwb',
        'w bbbbbbbw   bwb',
        'w bbbwbbw bbbbwb',
        'w bbwwgw bbbbbwb',
        'w bwwgbw bbbbbwb',
        'w bwgbggg bbbbwb',
        'w bggggg bbbbbwb',
        'w bgggg bbbbbbwb',
        'w b    bbbbbbbwb',
        'gwwwwwwwwwwwwwgb',
        ' bbbbbbbbbbbbbb ',
        '                '
    ],
};
class PowerUp extends React.PureComponent {
    render() {
        const { powerUp: { visible, x, y, powerUpName } } = this.props;
        return (React.createElement(elements_1.Bitmap, { style: { visibility: visible ? 'visible' : 'hidden' }, x: x, y: y, d: powerUpDataArray[powerUpName], scheme: colorSchema }));
    }
}
exports.default = PowerUp;


/***/ }),

/***/ 90:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const Zero = ({ x, y }) => (React.createElement("g", { role: "zero", transform: `translate(${x}, ${y})` },
    React.createElement("rect", { x: "1", y: "0", width: "2", height: "1" }),
    React.createElement("rect", { x: "1", y: "6", width: "2", height: "1" }),
    React.createElement("rect", { x: "0", y: "1", width: "1", height: "5" }),
    React.createElement("rect", { x: "3", y: "1", width: "1", height: "5" })));
const One = ({ x, y }) => (React.createElement("g", { role: "one", transform: `translate(${x}, ${y})` },
    React.createElement("rect", { x: "1", y: "1", width: "1", height: "1" }),
    React.createElement("rect", { x: "1", y: "6", width: "3", height: "1" }),
    React.createElement("rect", { x: "2", y: "0", width: "1", height: "7" })));
const Two = ({ x, y }) => (React.createElement("g", { role: "two", transform: `translate(${x}, ${y})` },
    React.createElement("rect", { x: "0", y: "1", width: "1", height: "1" }),
    React.createElement("rect", { x: "1", y: "0", width: "2", height: "1" }),
    React.createElement("rect", { x: "3", y: "1", width: "1", height: "2" }),
    React.createElement("rect", { x: "2", y: "3", width: "1", height: "1" }),
    React.createElement("rect", { x: "1", y: "4", width: "1", height: "1" }),
    React.createElement("rect", { x: "0", y: "5", width: "1", height: "1" }),
    React.createElement("rect", { x: "0", y: "6", width: "4", height: "1" })));
const Three = ({ x, y }) => (React.createElement("path", { role: "three", d: `M${x},${y + 1} h1 v-1 h2 v1 h1 v2 h-1 v1 h1 v2 h-1 v1 h-2 v-1 h-1 v-1 h1 v1 h2 v-2 h-2 v-1 h2 v-2 h-2 v1 h-1 v-1` }));
const Four = ({ x, y }) => (React.createElement("path", { role: "four", d: `M${x + 1},${y + 2} v-1 h1 v-1 h1 v4 h-1 v-2 h-1 v2 h3 v1 h-1 v2 h-1 v-2 h-2 v-3 h1` }));
const Five = ({ x, y }) => (React.createElement("path", { role: "five", d: `M${x},${y} h4 v1 h-3 v1 h2 v1 h1 v3 h-1 v1 h-2 v-1 h-1 v-1 h1 v1 h2 v-3 h-3 v-3` }));
class Score extends React.PureComponent {
    render() {
        const { score, x = 0, y = 0 } = this.props;
        let Num;
        if (score === 100) {
            Num = One;
        }
        else if (score === 200) {
            Num = Two;
        }
        else if (score === 300) {
            Num = Three;
        }
        else if (score === 400) {
            Num = Four;
        }
        else if (score === 500) {
            Num = Five;
        }
        else {
            throw new Error(`Invalid score: ${score}`);
        }
        return (React.createElement("g", { transform: `translate(${x},${y})`, fill: "white" },
            React.createElement(Num, { x: 1, y: 4 }),
            React.createElement(Zero, { x: 6, y: 4 }),
            React.createElement(Zero, { x: 11, y: 4 })));
    }
}
exports.default = Score;


/***/ }),

/***/ 91:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const constants_1 = __webpack_require__(2);
const BrickWall_1 = __webpack_require__(34);
const Text_1 = __webpack_require__(13);
class GameoverScene extends React.PureComponent {
    render() {
        const size = constants_1.ITEM_SIZE_MAP.BRICK;
        const scale = 4;
        return (React.createElement("g", { role: "gameover-scene" },
            React.createElement("defs", null,
                React.createElement("pattern", { id: "pattern-brickwall", width: size * 2 / scale, height: size * 2 / scale, patternUnits: "userSpaceOnUse" },
                    React.createElement("g", { transform: `scale(${1 / scale})` },
                        React.createElement(BrickWall_1.default, { x: 0, y: 0 }),
                        React.createElement(BrickWall_1.default, { x: 0, y: size }),
                        React.createElement(BrickWall_1.default, { x: size, y: 0 }),
                        React.createElement(BrickWall_1.default, { x: size, y: size })))),
            React.createElement("rect", { fill: "#000000", x: 0, y: 0, width: 16 * constants_1.BLOCK_SIZE, height: 15 * constants_1.BLOCK_SIZE }),
            React.createElement("g", { transform: `scale(${scale})` },
                React.createElement(Text_1.default, { content: "game", x: 4 * constants_1.BLOCK_SIZE / scale, y: 4 * constants_1.BLOCK_SIZE / scale, fill: "url(#pattern-brickwall)" }),
                React.createElement(Text_1.default, { content: "over", x: 4 * constants_1.BLOCK_SIZE / scale, y: 7 * constants_1.BLOCK_SIZE / scale, fill: "url(#pattern-brickwall)" }))));
    }
}
exports.default = GameoverScene;


/***/ }),

/***/ 92:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const Text_1 = __webpack_require__(13);
const tanks_1 = __webpack_require__(24);
const constants_1 = __webpack_require__(2);
const types_1 = __webpack_require__(9);
class StatisticsScene extends React.PureComponent {
    render() {
        const { transientKillInfo, stageName, showTotalKillCount } = this.props;
        const player1KillInfo = transientKillInfo.get('player-1');
        const basic = player1KillInfo.get('basic');
        const basicCountStr = basic === -1 ? '  ' : String(basic).padStart(2);
        const basicPointsStr = basic === -1 ? '    ' : String(basic * 100).padStart(4);
        const fast = player1KillInfo.get('fast');
        const fastCountStr = fast === -1 ? '  ' : String(fast).padStart(2);
        const fastPointsStr = fast === -1 ? '    ' : String(fast * 200).padStart(4);
        const power = player1KillInfo.get('power');
        const powerCountStr = power === -1 ? '  ' : String(power).padStart(2);
        const powerPointsStr = power === -1 ? '    ' : String(power * 300).padStart(4);
        const armor = player1KillInfo.get('armor');
        const armorCountStr = armor === -1 ? '  ' : String(armor).padStart(2);
        const armorPointsStr = armor === -1 ? '    ' : String(armor * 400).padStart(4);
        let player1Total = '  ';
        if (showTotalKillCount) {
            const total = (basic === -1 ? 0 : basic)
                + (fast === -1 ? 0 : fast)
                + (power === -1 ? 0 : power)
                + (armor === -1 ? 0 : armor);
            player1Total = String(total).padStart(2);
        }
        return (React.createElement("g", { role: "statistics-scene" },
            React.createElement("rect", { fill: "#000000", x: 0, y: 0, width: 16 * constants_1.BLOCK_SIZE, height: 16 * constants_1.BLOCK_SIZE }),
            React.createElement("g", { transform: `translate(${-0.5 * constants_1.BLOCK_SIZE}, ${-1.5 * constants_1.BLOCK_SIZE})` },
                React.createElement(Text_1.default, { content: "HI-SCORE", x: 4.5 * constants_1.BLOCK_SIZE, y: 3.5 * constants_1.BLOCK_SIZE, fill: "#e44437" }),
                React.createElement(Text_1.default, { content: "20000", x: 10 * constants_1.BLOCK_SIZE, y: 3.5 * constants_1.BLOCK_SIZE, fill: "#feac4e" }),
                React.createElement(Text_1.default, { content: `STAGE  ${stageName}`, x: 6.5 * constants_1.BLOCK_SIZE, y: 4.5 * constants_1.BLOCK_SIZE, fill: "#ffffff" }),
                React.createElement(tanks_1.Tank, { tank: types_1.TankRecord({ x: 8 * constants_1.BLOCK_SIZE, y: 7.7 * constants_1.BLOCK_SIZE, side: 'ai', level: 'basic' }) }),
                React.createElement(tanks_1.Tank, { tank: types_1.TankRecord({ x: 8 * constants_1.BLOCK_SIZE, y: 9.2 * constants_1.BLOCK_SIZE, side: 'ai', level: 'fast' }) }),
                React.createElement(tanks_1.Tank, { tank: types_1.TankRecord({ x: 8 * constants_1.BLOCK_SIZE, y: 10.7 * constants_1.BLOCK_SIZE, side: 'ai', level: 'power' }) }),
                React.createElement(tanks_1.Tank, { tank: types_1.TankRecord({ x: 8 * constants_1.BLOCK_SIZE, y: 12.2 * constants_1.BLOCK_SIZE, side: 'ai', level: 'armor' }) }),
                React.createElement("rect", { x: 6.5 * constants_1.BLOCK_SIZE, y: 13.3 * constants_1.BLOCK_SIZE, width: 4 * constants_1.BLOCK_SIZE, height: 2, fill: "white" }),
                React.createElement(Text_1.default, { content: '\u2160-PLAYER', x: 2 * constants_1.BLOCK_SIZE, y: 5.5 * constants_1.BLOCK_SIZE, fill: "#e44437" }),
                React.createElement(Text_1.default, { content: "3200", x: 4 * constants_1.BLOCK_SIZE, y: 6.5 * constants_1.BLOCK_SIZE, fill: "#feac4e" }),
                React.createElement(Text_1.default, { content: `${basicPointsStr} PTS ${basicCountStr}\u2190`, x: 2 * constants_1.BLOCK_SIZE, y: 8 * constants_1.BLOCK_SIZE, fill: "white" }),
                React.createElement(Text_1.default, { content: `${fastPointsStr} PTS ${fastCountStr}\u2190`, x: 2 * constants_1.BLOCK_SIZE, y: 9.5 * constants_1.BLOCK_SIZE, fill: "white" }),
                React.createElement(Text_1.default, { content: `${powerPointsStr} PTS ${powerCountStr}\u2190`, x: 2 * constants_1.BLOCK_SIZE, y: 11 * constants_1.BLOCK_SIZE, fill: "white" }),
                React.createElement(Text_1.default, { content: `${armorPointsStr} PTS ${armorCountStr}\u2190`, x: 2 * constants_1.BLOCK_SIZE, y: 12.5 * constants_1.BLOCK_SIZE, fill: "white" }),
                React.createElement(Text_1.default, { content: `TOTAL ${player1Total}`, x: 3.5 * constants_1.BLOCK_SIZE, y: 13.5 * constants_1.BLOCK_SIZE, fill: "white" }))));
    }
}
function mapStateToProps({ game: { transientKillInfo, currentStage, showTotalKillCount } }) {
    return {
        transientKillInfo,
        stageName: currentStage,
        showTotalKillCount,
    };
}
exports.default = react_redux_1.connect(mapStateToProps)(StatisticsScene);


/***/ }),

/***/ 93:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const BrickWall_1 = __webpack_require__(34);
const Text_1 = __webpack_require__(13);
const TextButton_1 = __webpack_require__(94);
const tanks_1 = __webpack_require__(24);
const constants_1 = __webpack_require__(2);
const types_1 = __webpack_require__(9);
function y(choice) {
    if (choice === '1-player') {
        return 8.25 * constants_1.BLOCK_SIZE;
    }
    else if (choice === '2-players') {
        return 9.25 * constants_1.BLOCK_SIZE;
    }
    else {
        return 10.25 * constants_1.BLOCK_SIZE;
    }
}
class GameTitleScene extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            choice: '1-player',
        };
    }
    render() {
        const size = constants_1.ITEM_SIZE_MAP.BRICK;
        const scale = 4;
        const { dispatch } = this.props;
        const { choice } = this.state;
        return (React.createElement("g", { role: "game-title-scene" },
            React.createElement("defs", null,
                React.createElement("pattern", { id: "pattern-brickwall", width: size * 2 / scale, height: size * 2 / scale, patternUnits: "userSpaceOnUse" },
                    React.createElement("g", { transform: `scale(${1 / scale})` },
                        React.createElement(BrickWall_1.default, { x: 0, y: 0 }),
                        React.createElement(BrickWall_1.default, { x: 0, y: size }),
                        React.createElement(BrickWall_1.default, { x: size, y: 0 }),
                        React.createElement(BrickWall_1.default, { x: size, y: size })))),
            React.createElement("rect", { fill: "#000000", width: 16 * constants_1.BLOCK_SIZE, height: 15 * constants_1.BLOCK_SIZE }),
            React.createElement("g", { transform: "scale(0.5)" },
                React.createElement(TextButton_1.default, { textFill: "#607d8b", x: 22 * constants_1.BLOCK_SIZE, y: constants_1.BLOCK_SIZE, content: "star me on github", onClick: () => window.open('https://github.com/shinima/battle-city') })),
            React.createElement(Text_1.default, { content: '\u2160-    00 HI- 20000', x: 1 * constants_1.BLOCK_SIZE, y: 1.5 * constants_1.BLOCK_SIZE }),
            React.createElement("g", { transform: `scale(${scale})` },
                React.createElement(Text_1.default, { content: "battle", x: 1.5 * constants_1.BLOCK_SIZE / scale, y: 3 * constants_1.BLOCK_SIZE / scale, fill: "url(#pattern-brickwall)" }),
                React.createElement(Text_1.default, { content: "city", x: 3.5 * constants_1.BLOCK_SIZE / scale + 1, y: 5.5 * constants_1.BLOCK_SIZE / scale, fill: "url(#pattern-brickwall)" })),
            React.createElement(TextButton_1.default, { content: "1 player", x: 5.5 * constants_1.BLOCK_SIZE, y: 8.5 * constants_1.BLOCK_SIZE, textFill: "white", onMouseOver: () => this.setState({ choice: '1-player' }), onClick: () => dispatch({ type: 'GAMESTART' }) }),
            React.createElement(TextButton_1.default, { content: "2 players", x: 5.5 * constants_1.BLOCK_SIZE, y: 9.5 * constants_1.BLOCK_SIZE, textFill: "white", disabled: true, onMouseOver: () => this.setState({ choice: '2-players' }) }),
            React.createElement(TextButton_1.default, { content: "editor", x: 5.5 * constants_1.BLOCK_SIZE, y: 10.5 * constants_1.BLOCK_SIZE, textFill: "white", onMouseOver: () => this.setState({ choice: 'editor' }) }),
            React.createElement(tanks_1.Tank, { tank: types_1.TankRecord({
                    side: 'human',
                    direction: 'right',
                    color: 'yellow',
                    moving: true,
                    x: 4 * constants_1.BLOCK_SIZE,
                    y: y(choice),
                }) }),
            React.createElement(Text_1.default, { content: '\u00a9 1980 1985 NAMCO LTD.', x: 2 * constants_1.BLOCK_SIZE, y: 12.5 * constants_1.BLOCK_SIZE }),
            React.createElement(Text_1.default, { content: "ALL RIGHTS RESERVED", x: 3 * constants_1.BLOCK_SIZE, y: 13.5 * constants_1.BLOCK_SIZE })));
    }
}
exports.default = react_redux_1.connect(undefined)(GameTitleScene);


/***/ })

},[156]);