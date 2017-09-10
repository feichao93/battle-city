webpackJsonp([0],{

/***/ 149:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const common_1 = __webpack_require__(5);
const canTankMove_1 = __webpack_require__(338);
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
const effects_1 = __webpack_require__(10);
const common_1 = __webpack_require__(5);
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
const App_1 = __webpack_require__(352);
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

/***/ 20:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var spawnTank_1 = __webpack_require__(340);
exports.spawnTank = spawnTank_1.default;
var destroyBullets_1 = __webpack_require__(341);
exports.destroyBullets = destroyBullets_1.default;
var destroyTanks_1 = __webpack_require__(342);
exports.destroyTanks = destroyTanks_1.default;
var timing_1 = __webpack_require__(343);
exports.timing = timing_1.default;
exports.nonPauseDelay = timing_1.nonPauseDelay;
exports.tween = timing_1.tween;


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
const redux_saga_1 = __webpack_require__(30);
const index_1 = __webpack_require__(50);
const index_2 = __webpack_require__(336);
const sagaMiddleware = redux_saga_1.default();
exports.default = redux_1.createStore(index_1.default, redux_1.applyMiddleware(sagaMiddleware));
sagaMiddleware.run(index_2.default);


/***/ }),

/***/ 33:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const _ = __webpack_require__(17);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(5);
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

/***/ 336:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const humanController_1 = __webpack_require__(337);
const bulletsSaga_1 = __webpack_require__(339);
const gameManager_1 = __webpack_require__(344);
const AISaga_1 = __webpack_require__(348);
const tickEmitter_1 = __webpack_require__(76);
const humanPlayerSaga_1 = __webpack_require__(350);
const pickPowerUps_1 = __webpack_require__(351);
const constants_1 = __webpack_require__(2);
function* rootSaga() {
    console.debug('root saga started');
    yield effects_1.fork(tickEmitter_1.default);
    yield effects_1.fork(bulletsSaga_1.default);
    yield effects_1.fork(pickPowerUps_1.default);
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

/***/ 337:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const selectors = __webpack_require__(33);
const _ = __webpack_require__(17);
const directionController_1 = __webpack_require__(149);
const fireController_1 = __webpack_require__(150);
const Mousetrap = __webpack_require__(151);
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
    function isGamePadConnected() {
        for (let gp of navigator.getGamepads()) {
            if (gp && gp.id === 'Xbox 360 Controller (XInput STANDARD GAMEPAD)') {
                return gp.index;
            }
        }
        return -1;
    }
    function getDirectionControlInfo() {
        if (isGamePadConnected() !== -1) {
            const gp = navigator.getGamepads()[isGamePadConnected()];
            if (gp) {
                // 摇杆右左
                if (gp.axes[0] > 0.5) {
                    return { direction: 'right' };
                }
                else if (gp.axes[0] < -0.5) {
                    return { direction: 'left' };
                }
                // 摇杆下上
                if (gp.axes[1] > 0.5) {
                    return { direction: 'down' };
                }
                else if (gp.axes[1] < -0.5) {
                    return { direction: 'up' };
                }
                return { direction: null };
            }
        }
        else {
            if (pressed.length > 0) {
                return { direction: _.last(pressed) };
            }
            else {
                return { direction: null };
            }
        }
    }
    // 调用该函数用来获取当前玩家的开火操作
    function shouldFire() {
        if (isGamePadConnected() !== -1) {
            const gp = navigator.getGamepads()[isGamePadConnected()];
            return gp && gp.buttons[6].pressed;
        }
        else {
            return firePressing || firePressed;
        }
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

/***/ 338:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = __webpack_require__(5);
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

/***/ 339:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(6);
const effects_1 = __webpack_require__(10);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(20);
const common_2 = __webpack_require__(5);
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
            const { xy, updater } = common_2.getDirectionInfo(direction);
            return bullet.update(xy, updater(distance));
        });
        yield effects_1.put({ type: 'UPDATE_BULLETS', updatedBullets });
    }
}
function* handleBulletsCollidedWithBricks(context) {
    // todo 需要考虑子弹强度
    const { bullets, map: { bricks } } = yield effects_1.select();
    bullets.forEach((bullet) => {
        for (const [row, col] of common_2.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, common_2.asBox(bullet))) {
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
        for (const [row, col] of common_2.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.STEEL, common_2.asBox(bullet))) {
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
    const object = common_2.asBox(bullet);
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
            for (const [row, col] of common_2.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.STEEL, spreadBullet(bullet))) {
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
function* destroyBricks(collidedBullets) {
    const { map: { bricks } } = yield effects_1.select();
    const bricksNeedToDestroy = [];
    collidedBullets.forEach((bullet) => {
        // TODO spreadBullet的时候 根据bullet.power的不同会影响spread的范围
        for (const [row, col] of common_2.iterRowsAndCols(constants_1.ITEM_SIZE_MAP.BRICK, spreadBullet(bullet))) {
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
    const { map: { eagle } } = yield effects_1.select();
    if (eagle == null) {
        return bullets.clear();
    }
    const { broken, x, y } = eagle;
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
        return bullets.filter(bullet => common_2.testCollide(eagleBox, common_2.asBox(bullet)));
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
            if (common_2.testCollide(subject, common_2.asBox(bullet), -0.02)) {
                const bulletSide = allTanks.find(t => (t.tankId === bullet.tankId)).side;
                const tankSide = tank.side;
                if (bulletSide === 'human' && tankSide === 'human') {
                    context.expBulletIdSet.add(bullet.bulletId);
                    context.frozenTankIdSet.add(tank.tankId);
                }
                else if (bulletSide === 'human' && tankSide === 'ai') {
                    const hurtSubMap = common_2.getOrDefault(context.tankHurtMap, tank.tankId, () => new Map());
                    const oldHurt = hurtSubMap.get(tank.tankId) || 0;
                    hurtSubMap.set(bullet.tankId, oldHurt + 1);
                    context.expBulletIdSet.add(bullet.bulletId);
                }
                else if (bulletSide === 'ai' && tankSide === 'human') {
                    if (tank.helmetDuration > 0) {
                        context.noExpBulletIdSet.add(bullet.bulletId);
                    }
                    else {
                        const hurtSubMap = common_2.getOrDefault(context.tankHurtMap, tank.tankId, () => new Map());
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
        const subject = common_2.asBox(bullet);
        for (const other of bullets.values()) {
            if (bullet.bulletId === other.bulletId) {
                continue;
            }
            const object = common_2.asBox(other);
            if (common_2.testCollide(subject, object)) {
                context.noExpBulletIdSet.add(bullet.bulletId);
            }
        }
    }
}
function calculateHurtsAndKillsFromContext({ tanks, players }, context) {
    const kills = [];
    const hurts = [];
    for (const [targetTankId, hurtMap] of context.tankHurtMap.entries()) {
        const hurt = common_2.sum(hurtMap.values());
        const targetTank = tanks.get(targetTankId);
        if (hurt >= targetTank.hp) {
            // 击杀了目标坦克
            const sourceTankId = hurtMap.keys().next().value;
            kills.push({
                type: 'KILL',
                targetTank,
                // 注意这里用allTanks, 因为sourceTank在这个时候可能已经挂了
                sourceTank: tanks.get(sourceTankId),
                targetPlayer: players.find(p => p.activeTankId === targetTankId),
                sourcePlayer: players.find(p => p.activeTankId === sourceTankId),
            });
        }
        else {
            hurts.push({
                type: 'HURT',
                targetTank,
                hurt,
            });
        }
    }
    return { kills, hurts };
}
function* handleAfterTick() {
    while (true) {
        yield effects_1.take('AFTER_TICK');
        const state = yield effects_1.select();
        const { bullets, players, tanks: allTanks } = state;
        const activeTanks = allTanks.filter(t => t.active);
        const bulletsCollidedWithEagle = yield* filterBulletsCollidedWithEagle(bullets);
        if (!bulletsCollidedWithEagle.isEmpty()) {
            yield effects_1.fork(common_1.destroyBullets, bulletsCollidedWithEagle, true);
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
            yield effects_1.fork(common_1.destroyBullets, expBullets, true);
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
        const { kills, hurts } = calculateHurtsAndKillsFromContext(state, context);
        yield* hurts.map(hurtAction => effects_1.put(hurtAction));
        // 注意 必须先fork destroyTanks, 然后再put killAction
        // stageSaga中take KILL的逻辑, 依赖于REMOVE_TANK已经被处理
        yield effects_1.fork(common_1.destroyTanks, immutable_1.Map(kills.map(kill => [kill.targetTank.tankId, kill.targetTank])));
        yield* kills.map(killAction => effects_1.put(killAction));
        // 不产生爆炸, 直接消失的子弹
        const noExpBullets = bullets.filter(bullet => context.noExpBulletIdSet.has(bullet.bulletId));
        yield effects_1.fork(common_1.destroyBullets, noExpBullets, false);
        // 移除在边界外面的子弹
        const outsideBullets = bullets.filterNot(bullet => common_2.isInField(common_2.asBox(bullet)));
        yield effects_1.fork(common_1.destroyBullets, outsideBullets, true);
    }
}
function* bulletsSaga() {
    yield effects_1.fork(handleTick);
    yield effects_1.fork(handleAfterTick);
}
exports.default = bulletsSaga;


/***/ }),

/***/ 340:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const types_1 = __webpack_require__(9);
const common_1 = __webpack_require__(5);
const common_2 = __webpack_require__(20);
function applySpawnSpeed(config, speed) {
    return config.map(({ t, v }) => ({ t: t / speed, v }));
}
// TODO 将flicker和add-tank的逻辑分离开来
function* spawnTank(tank, spawnSpeed = 1) {
    const flickerShapeTimingConfig = [
        { v: 3, t: common_1.frame(3) },
        { v: 2, t: common_1.frame(3) },
        { v: 1, t: common_1.frame(3) },
        { v: 0, t: common_1.frame(3) },
        { v: 1, t: common_1.frame(3) },
        { v: 2, t: common_1.frame(3) },
        { v: 3, t: common_1.frame(3) },
        { v: 2, t: common_1.frame(3) },
        { v: 1, t: common_1.frame(3) },
        { v: 0, t: common_1.frame(3) },
        { v: 1, t: common_1.frame(3) },
        { v: 2, t: common_1.frame(3) },
        { v: 3, t: common_1.frame(1) },
    ];
    const flickerId = common_1.getNextId('flicker');
    yield* common_2.timing(applySpawnSpeed(flickerShapeTimingConfig, spawnSpeed), function* (shape) {
        yield effects_1.put({
            type: 'ADD_OR_UPDATE_FLICKER',
            flicker: types_1.FlickerRecord({
                flickerId,
                x: tank.x,
                y: tank.y,
                shape,
            }),
        });
    });
    yield effects_1.put({
        type: 'REMOVE_FLICKER',
        flickerId,
    });
    const tankId = common_1.getNextId('tank');
    yield effects_1.put({
        type: 'ADD_TANK',
        tank: tank.set('tankId', tankId),
    });
    return tankId;
}
exports.default = spawnTank;


/***/ }),

/***/ 341:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(30);
const effects_1 = __webpack_require__(10);
const types_1 = __webpack_require__(9);
const common_1 = __webpack_require__(5);
function* explosionFromBullet(bullet) {
    const bulletExplosionShapeTiming = [
        ['s0', common_1.frame(4)],
        ['s1', common_1.frame(3)],
        ['s2', common_1.frame(2)],
    ];
    const explosionId = common_1.getNextId('explosion');
    for (const [shape, time] of bulletExplosionShapeTiming) {
        yield effects_1.put({
            type: 'ADD_OR_UPDATE_EXPLOSION',
            explosion: types_1.ExplosionRecord({
                cx: bullet.x + 2,
                cy: bullet.y + 2,
                shape,
                explosionId,
            }),
        });
        yield redux_saga_1.delay(time); // TODO 考虑PAUSE的情况
    }
    yield effects_1.put({
        type: 'REMOVE_EXPLOSION',
        explosionId,
    });
}
/** 移除单个子弹, 调用explosionFromBullet来生成子弹爆炸(并在之后移除子弹爆炸效果) */
function* destroyBullet(bullet, useExplosion) {
    yield effects_1.put({
        type: 'REMOVE_BULLET',
        bulletId: bullet.bulletId,
    });
    if (useExplosion) {
        yield* explosionFromBullet(bullet);
    }
}
/** 调用destroyBullet并使用ALL effects, 来同时移除若干个子弹 */
function* destroyBullets(bullets, useExplosion) {
    if (!bullets.isEmpty()) {
        yield effects_1.all(bullets.toArray().map(bullet => destroyBullet(bullet, useExplosion)));
    }
}
exports.default = destroyBullets;


/***/ }),

/***/ 342:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const types_1 = __webpack_require__(9);
const common_1 = __webpack_require__(5);
const constants_1 = __webpack_require__(2);
const common_2 = __webpack_require__(20);
function* scoreFromKillTank(tank) {
    const scoreId = common_1.getNextId('score');
    yield effects_1.put({
        type: 'ADD_SCORE',
        score: types_1.ScoreRecord({
            score: constants_1.TANK_KILL_SCORE_MAP[tank.level],
            scoreId,
            x: tank.x,
            y: tank.y,
        }),
    });
    yield common_2.nonPauseDelay(common_1.frame(48));
    yield effects_1.put({
        type: 'REMOVE_SCORE',
        scoreId,
    });
}
function* explosionFromTank(tank) {
    const tankExplosionShapeTiming = [
        { v: 's0', t: common_1.frame(7) },
        { v: 's1', t: common_1.frame(5) },
        { v: 's2', t: common_1.frame(7) },
        { v: 'b0', t: common_1.frame(5) },
        { v: 'b1', t: common_1.frame(7) },
        { v: 's2', t: common_1.frame(5) },
    ];
    const explosionId = common_1.getNextId('explosion');
    yield* common_2.timing(tankExplosionShapeTiming, function* (shape) {
        yield effects_1.put({
            type: 'ADD_OR_UPDATE_EXPLOSION',
            explosion: types_1.ExplosionRecord({
                cx: tank.x + 8,
                cy: tank.y + 8,
                shape,
                explosionId,
            }),
        });
    });
    yield effects_1.put({
        type: 'REMOVE_EXPLOSION',
        explosionId,
    });
}
function* killTank(tank) {
    // 移除坦克
    yield effects_1.put({
        type: 'REMOVE_TANK',
        tankId: tank.tankId,
    });
    // 产生坦克爆炸效果
    yield* explosionFromTank(tank);
    if (tank.side === 'ai') {
        yield* scoreFromKillTank(tank);
    }
}
// 移除坦克 & 产生爆炸效果 & 显示击杀得分信息
function* destroyTanks(tanks) {
    yield effects_1.all(tanks.toArray().map(killTank));
}
exports.default = destroyTanks;


/***/ }),

/***/ 343:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __webpack_require__(17);
const effects_1 = __webpack_require__(10);
function* timing(config, handler) {
    let acc = 0;
    let target = 0;
    for (const { t, v } of config) {
        yield* handler(v);
        target += t;
        while (true) {
            const { delta } = yield effects_1.take('TICK');
            acc += delta;
            if (acc >= target) {
                break;
            }
        }
    }
}
exports.default = timing;
/** 用于生成等待一段时间的effect.
 * 该函数作用和delay类似, 不过该函数会考虑游戏暂停的情况 */
function nonPauseDelay(ms) {
    return effects_1.call(timing, [{ v: null, t: ms }], () => []);
}
exports.nonPauseDelay = nonPauseDelay;
function* tween(duration, effectFactory) {
    let accumulation = 0;
    while (accumulation < duration) {
        const { delta } = yield effects_1.take('TICK');
        accumulation += delta;
        yield effectFactory(lodash_1.clamp(accumulation / duration, 0, 1));
    }
}
exports.tween = tween;


/***/ }),

/***/ 344:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(5);
const stageSaga_1 = __webpack_require__(345);
const common_2 = __webpack_require__(20);
const stages_1 = __webpack_require__(41);
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
    yield common_2.nonPauseDelay(500);
    yield effects_1.put({ type: 'REMOVE_TEXT', textId: textId1 });
    yield effects_1.put({ type: 'REMOVE_TEXT', textId: textId2 });
    yield effects_1.put({ type: 'LOAD_SCENE', scene: 'gameover' });
}
/**
 *  game-saga负责管理整体游戏进度
 *  负责管理游戏开始界面, 游戏结束界面
 *  game-stage调用stage-saga来运行不同的关卡
 *  并根据stage-saga返回的结果选择继续下一个关卡, 或是选择游戏结束
 */
function* gameManager() {
    if (true) {
        yield effects_1.take((action) => action.type === 'GAMESTART');
    }
    const stages = Object.keys(stages_1.default);
    for (const stageName of stages) {
        const stageResult = yield* stageSaga_1.default(stageName);
        if (false) {
            console.log('stageResult:', stageResult);
        }
        if (stageResult.status === 'clear') {
            // continue to next stage
        }
        else {
            console.log(`gameover, reason: ${stageResult.reason}`);
            yield* animateGameover();
            break;
        }
    }
}
exports.default = gameManager;


/***/ }),

/***/ 345:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const _ = __webpack_require__(17);
const effects_1 = __webpack_require__(10);
const selectors = __webpack_require__(33);
const common_1 = __webpack_require__(5);
const types_1 = __webpack_require__(9);
const common_2 = __webpack_require__(20);
const powerUp_1 = __webpack_require__(346);
const stageStatistics_1 = __webpack_require__(347);
function* startStage(stageName) {
    // todo action SHOW_CURTAIN
    yield effects_1.put({
        type: 'UPDATE_CURTAIN',
        curtainName: 'stage-enter-cutain',
        t: 0,
    });
    yield* common_2.tween(common_1.frame(30), t => effects_1.put({
        type: 'UPDATE_CURTAIN',
        curtainName: 'stage-enter-cutain',
        t,
    }));
    yield common_2.nonPauseDelay(common_1.frame(20));
    yield effects_1.put({
        type: 'LOAD_STAGE_MAP',
        name: stageName,
    });
    yield common_2.nonPauseDelay(common_1.frame(20));
    yield* common_2.tween(common_1.frame(30), t => effects_1.put({
        type: 'UPDATE_CURTAIN',
        curtainName: 'stage-enter-cutain',
        t: 1 - t,
    }));
    // todo action HIDE_CURTAIN
    // yield svgFilter 添加反色效果
    // yield put<Action>({type:'FILTER_INVERT'})
    // 移除反色效果
    // yield fork(delayedPut, f(3), { type: 'REMOEV_FILTER_INVERT' })
    yield effects_1.put({
        type: 'START_STAGE',
        name: stageName,
    });
    yield effects_1.put({ type: 'SHOW_HUD' });
}
function* spawnPowerUp({ targetTank }) {
    if (targetTank.withPowerUp) {
        const powerUpName = _.sample(['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel']);
        const position = _.sample(yield effects_1.select(selectors.validPowerUpSpawnPositions));
        yield* powerUp_1.default(types_1.PowerUpRecord({
            powerUpId: common_1.getNextId('power-up'),
            powerUpName,
            visible: true,
            x: position.x,
            y: position.y,
        }));
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
    yield* startStage(stageName);
    while (true) {
        const action = yield effects_1.take(['KILL', 'DESTROY_EAGLE']);
        if (action.type === 'KILL') {
            const { sourcePlayer, targetTank } = action;
            const { players, game: { remainingEnemies }, tanks } = yield effects_1.select();
            // TODO 这里sourcePlayer可能为空将导致游戏崩溃 (AI-PLAYER被移除了)
            if (sourcePlayer.side === 'human') {
                // 对human player的击杀信息进行统计
                yield effects_1.put({
                    type: 'INC_KILL_COUNT',
                    playerName: sourcePlayer.playerName,
                    level: targetTank.level,
                });
                yield effects_1.fork(spawnPowerUp, action);
                const activeAITanks = tanks.filter(t => (t.active && t.side === 'ai'));
                if (remainingEnemies.isEmpty() && activeAITanks.isEmpty()) {
                    // 剩余enemy数量为0, 且场上已经没有ai tank了
                    yield common_2.nonPauseDelay(1500);
                    const { powerUps } = yield effects_1.select();
                    if (!powerUps.isEmpty()) {
                        // 如果场上有powerup, 则适当延长结束时间
                        yield common_2.nonPauseDelay(5000);
                    }
                    yield* stageStatistics_1.default();
                    yield effects_1.put({ type: 'HIDE_HUD' });
                    yield effects_1.put({ type: 'END_STAGE' });
                    yield effects_1.put({ type: 'CLEAR_TANKS' });
                    return { status: 'clear' };
                }
            }
            else {
                if (!players.some(ply => ply.side === 'human' && ply.lives > 0)) {
                    // 所有的human player都挂了
                    yield common_2.nonPauseDelay(1500);
                    yield* stageStatistics_1.default();
                    yield effects_1.put({ type: 'HIDE_HUD' });
                    yield effects_1.put({ type: 'END_STAGE' });
                    yield effects_1.put({ type: 'CLEAR_TANKS' });
                    return { status: 'fail', reason: 'all-human-dead' };
                }
            }
        }
        else if (action.type === 'DESTROY_EAGLE') {
            return { status: 'fail', reason: 'DESTROY_EAGLE' };
        }
    }
}
exports.default = stageSaga;


/***/ }),

/***/ 346:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const common_1 = __webpack_require__(5);
const common_2 = __webpack_require__(20);
function* powerUp(powerUp) {
    const pickThisPowerUp = (action) => (action.type === 'PICK_POWER_UP'
        && action.powerUp.powerUpId === powerUp.powerUpId);
    try {
        yield effects_1.put({
            type: 'ADD_POWER_UP',
            powerUp,
        });
        let visible = true;
        for (let i = 0; i < 50; i++) {
            const result = yield effects_1.race({
                timeout: common_2.nonPauseDelay(common_1.frame(8)),
                picked: effects_1.take(pickThisPowerUp),
                stageChanged: effects_1.take('START_STAGE'),
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
exports.default = powerUp;


/***/ }),

/***/ 347:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(6);
const effects_1 = __webpack_require__(10);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(20);
function* statistics() {
    yield effects_1.put({ type: 'LOAD_SCENE', scene: 'statistics' });
    const { game: { killInfo } } = yield effects_1.select();
    const player1KillInfo = killInfo.get('player-1', immutable_1.Map());
    // todo 目前只考虑player-1的信息
    yield common_1.nonPauseDelay( true ? 500 : 200);
    for (const tankLevel of constants_1.TANK_LEVELS) {
        const { game: { transientKillInfo } } = yield effects_1.select();
        yield common_1.nonPauseDelay( true ? 250 : 100);
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
                yield common_1.nonPauseDelay( true ? 160 : 64);
            }
        }
        yield common_1.nonPauseDelay( true ? 200 : 80);
    }
    yield common_1.nonPauseDelay( true ? 200 : 80);
    yield effects_1.put({ type: 'SHOW_TOTAL_KILL_COUNT' });
    yield common_1.nonPauseDelay( true ? 1000 : 400);
}
exports.default = statistics;


/***/ }),

/***/ 348:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(30);
const effects_1 = __webpack_require__(10);
const common_1 = __webpack_require__(5);
const directionController_1 = __webpack_require__(149);
const fireController_1 = __webpack_require__(150);
const common_2 = __webpack_require__(20);
const common_3 = __webpack_require__(5);
const selectors = __webpack_require__(33);
const types_1 = __webpack_require__(9);
const AIWorker = __webpack_require__(349);
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
    // yield fork(function* notifyWhenBulletComplete() {
    //   while (true) {
    //     // TODO 修复BUG
    //     const { bullets }: Action.DestroyBulletsAction = yield take('DESTROY_BULLETS')
    //     const tank = yield select(selectors.playerTank, playerName)
    //     if (tank != null) {
    //       if (bullets.some(b => (b.tankId === tank.tankId))) {
    //         console.debug('bullet-completed. notify')
    //         noteChannel.put({ type: 'bullet-complete' })
    //       }
    //     }
    //   }
    // })
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
                const canFire = bulletCount < common_3.getTankBulletLimit(tank) && tank.cooldown <= 0;
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
        const actionTypes = ['KILL', 'START_STAGE', 'GAMEOVER'];
        const action = yield effects_1.take(actionTypes);
        if (action.type === 'START_STAGE') {
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
            const { game: { remainingEnemies, currentStage } } = yield effects_1.select();
            if (!remainingEnemies.isEmpty()) {
                const playerName = `AI-${common_3.getNextId('AI-player')}`;
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
                const tankId = yield* common_2.spawnTank(types_1.TankRecord({
                    x,
                    y,
                    side: 'ai',
                    level,
                    hp,
                    withPowerUp: Math.random() < common_3.getWithPowerUpProbability(currentStage),
                }), 0.6); // todo 要根据关卡的难度来确定坦克的生成速度
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

/***/ 349:
/***/ (function(module, exports, __webpack_require__) {

module.exports = function() {
	return new Worker(__webpack_require__.p + "45be0eadbba1d87a2a7c.worker.js");
};

/***/ }),

/***/ 350:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(5);
const types_1 = __webpack_require__(9);
const common_2 = __webpack_require__(20);
const selectors = __webpack_require__(33);
function* handlePickPowerUps(playerName) {
    const tank = yield effects_1.select(selectors.playerTank, playerName);
    if (tank != null) {
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
/** 关卡开始时, 需要创建玩家的tank.
 * 如果玩家在上一关结束时有坦克保留, 则这一关开始的时候使用上一关保留的坦克 */
function* startStage(playerName, tankColor) {
    const { players } = yield effects_1.select();
    const player = players.get(playerName);
    if (player.reservedTank || player.lives > 0) {
        if (!player.reservedTank) {
            yield effects_1.put({
                type: 'DECREMENT_PLAYER_LIFE',
                playerName,
            });
        }
        yield effects_1.put({
            type: 'SET_REVERSED_TANK',
            playerName,
            reversedTank: null,
        });
        const tankPrototype = player.reservedTank || types_1.TankRecord({
            side: 'human',
            color: tankColor,
            level: 'basic',
        });
        const tankId = yield* common_2.spawnTank(tankPrototype.merge({
            active: true,
            x: 4 * constants_1.BLOCK_SIZE,
            y: 12 * constants_1.BLOCK_SIZE,
            direction: 'up',
            helmetDuration: common_1.frame(135),
        }));
        yield effects_1.put({
            type: 'ACTIVATE_PLAYER',
            playerName,
            tankId,
        });
    }
}
function* endStage(playerName) {
    const tank = yield effects_1.select(selectors.playerTank, playerName);
    if (tank) {
        yield effects_1.put({
            type: 'SET_REVERSED_TANK',
            playerName,
            reversedTank: tank,
        });
    }
}
function* killed(playerName, tankColor) {
    const { players } = yield effects_1.select();
    const player = players.get(playerName);
    if (player.lives > 0) {
        yield effects_1.put({ type: 'DECREMENT_PLAYER_LIFE', playerName });
        const tankId = yield* common_2.spawnTank(types_1.TankRecord({
            x: 4 * constants_1.BLOCK_SIZE,
            y: 12 * constants_1.BLOCK_SIZE,
            side: 'human',
            color: tankColor,
            level: 'basic',
            helmetDuration: common_1.frame(180),
        }));
        yield effects_1.put({
            type: 'ACTIVATE_PLAYER',
            playerName,
            tankId,
        });
    }
}
function* humanPlayerSaga(playerName, tankColor) {
    yield effects_1.put({
        type: 'CREATE_PLAYER',
        player: types_1.PlayerRecord({
            playerName,
            lives: 3,
            side: 'human',
        }),
    });
    yield effects_1.takeEvery('AFTER_TICK', handlePickPowerUps, playerName);
    yield effects_1.takeEvery('START_STAGE', startStage, playerName, tankColor);
    yield effects_1.takeEvery('END_STAGE', endStage, playerName);
    yield effects_1.takeEvery(killedAction, killed, playerName, tankColor);
    function killedAction(action) {
        return action.type === 'KILL'
            && action.targetPlayer.playerName === playerName;
    }
}
exports.default = humanPlayerSaga;


/***/ }),

/***/ 351:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = __webpack_require__(10);
const types_1 = __webpack_require__(9);
const constants_1 = __webpack_require__(2);
const common_1 = __webpack_require__(5);
const common_2 = __webpack_require__(20);
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
    yield common_2.nonPauseDelay(common_1.frame(1076));
    // 总共闪烁6次
    for (let i = 0; i < 6; i++) {
        yield effects_1.put({
            type: 'UPDATE_MAP',
            map: convertToBricks((yield effects_1.select()).map),
        });
        yield common_2.nonPauseDelay(common_1.frame(16));
        yield effects_1.put({
            type: 'UPDATE_MAP',
            map: convertToSteels((yield effects_1.select()).map),
        });
        yield common_2.nonPauseDelay(common_1.frame(16));
    }
    // 最后变回brick-wall
    yield effects_1.put({
        type: 'UPDATE_MAP',
        map: convertToBricks((yield effects_1.select()).map),
    });
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
    const { tanks: allTanks, players } = yield effects_1.select();
    const activeAITanks = allTanks.filter(t => (t.active && t.side === 'ai'));
    yield* common_2.destroyTanks(activeAITanks);
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
        duration: common_1.frame(630),
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
function* scoreFromPickPowerUp(action) {
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
    yield common_2.nonPauseDelay(common_1.frame(48));
    yield effects_1.put({
        type: 'REMOVE_SCORE',
        scoreId,
    });
}
/** 该saga用来处理道具拾取时触发的相应逻辑 */
function* pickPowerUps() {
    yield effects_1.takeEvery('PICK_POWER_UP', scoreFromPickPowerUp);
    yield effects_1.takeLatest(is('shovel'), shovel);
    yield effects_1.takeLatest(is('timer'), timer);
    yield effects_1.takeEvery(is('grenade'), grenade);
    yield effects_1.takeEvery(is('star'), star);
    yield effects_1.takeEvery(is('tank'), tank);
    yield effects_1.takeEvery(is('helmet'), helmet);
    yield effects_1.fork(handleHelmetDuration);
}
exports.default = pickPowerUps;


/***/ }),

/***/ 352:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const constants_1 = __webpack_require__(2);
const GameScene_1 = __webpack_require__(353);
const GameoverScene_1 = __webpack_require__(92);
const StatisticsScene_1 = __webpack_require__(93);
const GameTitleScene_1 = __webpack_require__(94);
const PauseIndicator_1 = __webpack_require__(360);
const CurtainsContainer_1 = __webpack_require__(361);
const Inspector_1 = __webpack_require__(364);
const HelpInfo = () => (React.createElement("div", { style: { maxWidth: 200, marginLeft: 20 } },
    React.createElement("p", null,
        "\u5F53\u524D\u7248\u672C ",
        "0.1.4"),
    React.createElement("p", null,
        "\u7F16\u8BD1\u65F6\u95F4 ",
        "2017-09-10 19:58:25"),
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
const zoomLevel = 2;
const totalWidth = 16 * constants_1.BLOCK_SIZE;
const totalHeight = 15 * constants_1.BLOCK_SIZE;
class App extends React.PureComponent {
    render() {
        const { scene, paused } = this.props;
        return (React.createElement("div", { style: { display: 'flex' } },
            React.createElement("svg", { className: "svg", style: { background: '#757575' }, width: totalWidth * zoomLevel, height: totalHeight * zoomLevel, viewBox: `0 0 ${totalWidth} ${totalHeight}` },
                scene === 'game-title' ? React.createElement(GameTitleScene_1.default, null) : null,
                scene === 'game' ? React.createElement(GameScene_1.default, null) : null,
                scene === 'gameover' ? React.createElement(GameoverScene_1.default, null) : null,
                scene === 'statistics' ? React.createElement(StatisticsScene_1.default, null) : null,
                React.createElement(CurtainsContainer_1.default, null),
                paused ? React.createElement(PauseIndicator_1.default, null) : null),
             false ? React.createElement(Inspector_1.default, null) : null,
             true ? React.createElement(HelpInfo, null) : null));
    }
}
function mapStateToProps(state) {
    return {
        scene: state.game.scene,
        paused: state.game.paused,
    };
}
exports.default = react_redux_1.connect(mapStateToProps)(App);


/***/ }),

/***/ 353:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const _ = __webpack_require__(17);
const constants_1 = __webpack_require__(2);
const tanks_1 = __webpack_require__(24);
const HUD_1 = __webpack_require__(77);
const Bullet_1 = __webpack_require__(80);
const BrickLayer_1 = __webpack_require__(81);
const SteelLayer_1 = __webpack_require__(82);
const RiverLayer_1 = __webpack_require__(83);
const SnowLayer_1 = __webpack_require__(85);
const ForestLayer_1 = __webpack_require__(86);
const Eagle_1 = __webpack_require__(87);
const Explosion_1 = __webpack_require__(88);
const Flicker_1 = __webpack_require__(89);
const TankHelmet_1 = __webpack_require__(357);
const TextLayer_1 = __webpack_require__(358);
const PowerUp_1 = __webpack_require__(90);
const Score_1 = __webpack_require__(91);
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
                eagle ?
                    React.createElement(Eagle_1.default, { x: eagle.x, y: eagle.y, broken: eagle.broken }) : null,
                React.createElement("g", { role: "bullet-layer" }, bullets.map((b, i) => React.createElement(Bullet_1.default, { key: i, direction: b.direction, x: b.x, y: b.y })).toArray()),
                React.createElement("g", { role: "tank-layer" }, activeTanks.map(tank => React.createElement(tanks_1.Tank, { key: tank.tankId, tank: tank })).toArray()),
                React.createElement("g", { role: "helmet-layer" }, activeTanks.map(tank => tank.helmetDuration > 0 ? (React.createElement(TankHelmet_1.default, { key: tank.tankId, x: tank.x, y: tank.y })) : null).toArray()),
                React.createElement(ForestLayer_1.default, { forests: forests }),
                React.createElement("g", { role: "power-up-layer" }, powerUps.map(powerUp => React.createElement(PowerUp_1.default, { key: powerUp.powerUpId, powerUp: powerUp })).toArray()),
                React.createElement("g", { role: "explosion-layer" }, explosions.map(exp => React.createElement(Explosion_1.default, { key: exp.explosionId, explosion: exp })).toArray()),
                React.createElement("g", { role: "flicker-layer" }, flickers.map(flicker => React.createElement(Flicker_1.default, { key: flicker.flickerId, flicker: flicker })).toArray()),
                React.createElement("g", { role: "score-layer" }, scores.map(s => React.createElement(Score_1.default, { key: s.scoreId, score: s.score, x: s.x, y: s.y })).toArray())),
            React.createElement(TextLayer_1.default, { texts: texts })));
    }
}
exports.default = react_redux_1.connect(_.identity)(GameScene);


/***/ }),

/***/ 357:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const common_1 = __webpack_require__(5);
const registerTick_1 = __webpack_require__(84);
class TankHelmet extends React.PureComponent {
    render() {
        const { x, y, tickIndex } = this.props;
        const ds = [
            'M0,8 v-2 h1 v-1 h1 v-1 h2 v-2 h1 v-1 h1 v-1 h2 v1 h-2 v1 h-1 v2 h-1 v1 h-2 v1 h-1 v2 h-1',
            'M0,2 h1 v-1 h1 v-1 h2 v1 h1 v1 h2 v1 h1 v1 h-1 v-1 h-2 v-1 h-1 v-1 h-2 v1 h-1 v2 h1 v1 h1 v2 h1 v1 h-1 v-1 h-1 v-2 h-1 v-1 h-1 v-2',
        ];
        return (React.createElement("g", { role: "tank-helmet", transform: `translate(${x}, ${y})`, fill: "white" },
            React.createElement("path", { d: ds[tickIndex] }),
            React.createElement("path", { transform: "translate(16,0)rotate(90)", d: ds[tickIndex] }),
            React.createElement("path", { transform: "translate(16, 16)rotate(180)", d: ds[tickIndex] }),
            React.createElement("path", { transform: "translate(0, 16)rotate(270)", d: ds[tickIndex] })));
    }
}
exports.default = registerTick_1.default(common_1.frame(2), common_1.frame(2))(TankHelmet);


/***/ }),

/***/ 358:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const Text_1 = __webpack_require__(12);
class TextLayer extends React.PureComponent {
    render() {
        const { texts } = this.props;
        return (React.createElement("g", { role: "text-layer" }, texts.map(t => React.createElement(Text_1.default, { key: t.textId, content: t.content, fill: t.fill, x: t.x, y: t.y })).toArray()));
    }
}
exports.default = TextLayer;


/***/ }),

/***/ 360:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const Text_1 = __webpack_require__(12);
const constants_1 = __webpack_require__(2);
class PauseIndicator extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.handle = null;
        this.state = {
            visible: true,
        };
    }
    componentDidMount() {
        this.handle = setInterval(() => this.setState({ visible: !this.state.visible }), 250);
    }
    componentWillUnmount() {
        clearInterval(this.handle);
    }
    render() {
        return (React.createElement("g", { role: "pause-indicator" },
            React.createElement(Text_1.default, { content: "pause", x: 6.25 * constants_1.BLOCK_SIZE, y: 8 * constants_1.BLOCK_SIZE, fill: "#db2b00", style: { visibility: this.state.visible ? 'visible' : 'hidden' } })));
    }
}
exports.default = PauseIndicator;


/***/ }),

/***/ 361:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const StageEnterCurtain_1 = __webpack_require__(362);
class CurtainsContainer extends React.PureComponent {
    render() {
        const { stageEnterCurtainT: t } = this.props;
        return React.createElement(StageEnterCurtain_1.default, { stageName: "stage  1", t: t });
    }
}
function mapStateToProps(state) {
    return {
        stageEnterCurtainT: state.game.stageEnterCurtainT,
    };
}
exports.default = react_redux_1.connect(mapStateToProps)(CurtainsContainer);


/***/ }),

/***/ 362:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const constants_1 = __webpack_require__(2);
const Curtain_1 = __webpack_require__(363);
const Text_1 = __webpack_require__(12);
class StageEnterCurtain extends React.PureComponent {
    render() {
        const { t, stageName } = this.props;
        return (React.createElement(Curtain_1.default, { name: "stage-enter/exit", t: t, x: constants_1.BLOCK_SIZE, y: constants_1.BLOCK_SIZE, width: 13 * constants_1.BLOCK_SIZE, height: 13 * constants_1.BLOCK_SIZE },
            React.createElement("rect", { width: 13 * constants_1.BLOCK_SIZE, height: 13 * constants_1.BLOCK_SIZE, fill: "#757575" }),
            React.createElement(Text_1.default, { content: stageName, x: 5 * constants_1.BLOCK_SIZE, y: 6 * constants_1.BLOCK_SIZE, fill: "black" })));
    }
}
exports.default = StageEnterCurtain;


/***/ }),

/***/ 363:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
class Curtain extends React.PureComponent {
    render() {
        const { name, children, t, x = 0, y = 0, width, height } = this.props;
        return (React.createElement("g", { role: `curtain-${name}`, transform: `translate(${x}, ${y})` },
            React.createElement("defs", null,
                React.createElement("clipPath", { id: "default-curtain" },
                    React.createElement("rect", { x: 0, y: 0, width: width, height: height / 2 * t }),
                    React.createElement("rect", { x: 0, y: height * (1 - t / 2), width: width, height: height / 2 * t }))),
            React.createElement("g", { clipPath: "url(#default-curtain)" }, children)));
    }
}
exports.default = Curtain;


/***/ }),

/***/ 364:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const _ = __webpack_require__(17);
function roundTank(t) {
    return t.update('x', Math.round)
        .update('y', Math.round)
        .update('cooldown', Math.round)
        .update('helmetDuration', Math.round);
}
class Inspector extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            view: 'scores',
            allScores: this.props.scores,
            allTanks: this.props.tanks.map(roundTank),
            allPlayers: this.props.players,
            allExplosions: this.props.explosions,
        };
        this.debugger = () => {
            console.log('state =', this.state);
            console.log('props =', this.props);
            (function (w) {
                w.state = this.state;
                w.props = this.props;
            }).call(this, window);
            debugger;
        };
    }
    componentWillReceiveProps(nextProps) {
        const { scores, tanks, players, explosions } = this.props;
        const { allScores, allTanks, allPlayers, allExplosions } = this.state;
        this.setState({
            allScores: allScores.merge(scores),
            allTanks: allTanks.merge(tanks.map(roundTank)),
            allPlayers: allPlayers.merge(players),
            allExplosions: allExplosions.merge(explosions),
        });
    }
    renderPlayersView() {
        const { players } = this.props;
        const { allPlayers } = this.state;
        return (React.createElement("div", { role: "players-view" },
            allPlayers.isEmpty() ? React.createElement("p", null, " EMPTY PLAYERS ") : null,
            allPlayers.map(p => React.createElement("pre", { key: p.playerName, style: {
                    textDecoration: players.has(p.playerName) ? 'none' : 'line-through',
                } }, JSON.stringify(p, null, 2))).toArray()));
    }
    renderExplosionsView() {
        const { explosions } = this.props;
        const { allExplosions } = this.state;
        return (React.createElement("div", { role: "explosions-view" },
            allExplosions.isEmpty() ? React.createElement("p", null, "EMPTY EXPLOSIONS") : null,
            allExplosions.map(exp => React.createElement("pre", { key: exp.explosionId, style: {
                    textDecoration: explosions.has(exp.explosionId) ? 'none' : 'line-through',
                } }, JSON.stringify(exp, null, 2))).toArray()));
    }
    renderTanksView() {
        const { tanks } = this.props;
        const { allTanks } = this.state;
        return (React.createElement("div", { role: "tanks-view" },
            allTanks.isEmpty() ? React.createElement("p", null, "EMPTY TANKS") : null,
            allTanks.map(t => React.createElement("pre", { key: t.tankId, style: {
                    textDecoration: tanks.has(t.tankId) ? 'none' : 'line-through',
                } }, JSON.stringify(t, null, 2))).toArray()));
    }
    renderScoresView() {
        const { scores } = this.props;
        const { allScores } = this.state;
        return (React.createElement("div", null,
            allScores.isEmpty() ? React.createElement("p", null, "EMPTY") : null,
            allScores.map(s => React.createElement("pre", { key: s.scoreId, style: {
                    textDecoration: scores.has(s.scoreId) ? 'none' : 'line-through',
                } }, JSON.stringify(s, null, 2))).toArray()));
    }
    render() {
        const { view } = this.state;
        return (React.createElement("div", { style: {
                maxHeight: '100vh',
                overflow: 'auto',
                fontSize: '12px',
                border: '1px solid red',
            } },
            React.createElement("div", { style: { display: 'flex' } },
                React.createElement("button", { style: { color: view === 'scores' ? 'green' : 'inherit' }, onClick: () => this.setState({ view: 'scores' }) }, "Score"),
                React.createElement("button", { style: { color: view === 'tanks' ? 'green' : 'inherit' }, onClick: () => this.setState({ view: 'tanks' }) }, "Tanks"),
                React.createElement("button", { style: { color: view === 'players' ? 'green' : 'inherit' }, onClick: () => this.setState({ view: 'players' }) }, "Players"),
                React.createElement("button", { style: { color: view === 'explosions' ? 'green' : 'inherit' }, onClick: () => this.setState({ view: 'explosions' }) }, "Explosions"),
                React.createElement("button", { onClick: this.debugger }, "debugger")),
            view === 'scores' ? this.renderScoresView() : null,
            view === 'tanks' ? this.renderTanksView() : null,
            view === 'players' ? this.renderPlayersView() : null,
            view === 'explosions' ? this.renderExplosionsView() : null));
    }
}
exports.default = react_redux_1.connect(_.identity)(Inspector);


/***/ }),

/***/ 77:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const EnemyCountIndicator_1 = __webpack_require__(78);
const icons_1 = __webpack_require__(79);
const Text_1 = __webpack_require__(12);
const constants_1 = __webpack_require__(2);
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
        const { remainingEnemyCount, show } = this.props;
        return (React.createElement("g", { role: "HUD", display: show ? 'inline' : 'none' },
            React.createElement(EnemyCountIndicator_1.default, { count: remainingEnemyCount }),
            this.renderPlayer1Info(),
            this.renderPlayer2Info()));
    }
}
function mapStateToProps(state) {
    return {
        remainingEnemyCount: state.game.remainingEnemies.size,
        players: state.players,
        show: state.game.showHUD,
    };
}
exports.default = react_redux_1.connect(mapStateToProps)(HUD);


/***/ }),

/***/ 78:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const _ = __webpack_require__(17);
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

/***/ 88:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const elements_1 = __webpack_require__(18);
const schema = {
    ' ': 'none',
    W: '#fffffe',
    P: '#590d79',
    R: '#b53121',
};
const data = {
    s0: [
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
    s1: [
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
    s2: [
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
    b0: [
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
    b1: [
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
};
class Explosion extends React.PureComponent {
    render() {
        const { explosion: { cx, cy, shape, explosionId } } = this.props;
        const smallShape = shape === 's0' || shape === 's1' || shape === 's2';
        return (React.createElement(elements_1.Bitmap, { x: cx - (smallShape ? 8 : 16), y: cy - (smallShape ? 8 : 16), d: data[shape], scheme: schema }));
    }
}
exports.default = Explosion;


/***/ }),

/***/ 89:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
class Flicker extends React.PureComponent {
    render() {
        const { flicker: { x, y, shape } } = this.props;
        const transform = `translate(${x},${y})`;
        if (shape === 0) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 3, y: 7, width: 9, height: 1 }),
                React.createElement("rect", { x: 6, y: 6, width: 3, height: 3 }),
                React.createElement("rect", { x: 7, y: 3, width: 1, height: 9 })));
        }
        else if (shape === 1) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 2, y: 7, width: 11, height: 1 }),
                React.createElement("rect", { x: 5, y: 6, width: 5, height: 3 }),
                React.createElement("rect", { x: 6, y: 5, width: 3, height: 5 }),
                React.createElement("rect", { x: 7, y: 2, width: 1, height: 11 })));
        }
        else if (shape === 2) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 1, y: 7, width: 13, height: 1 }),
                React.createElement("rect", { x: 4, y: 6, width: 7, height: 3 }),
                React.createElement("rect", { x: 6, y: 4, width: 3, height: 7 }),
                React.createElement("rect", { x: 7, y: 1, width: 1, height: 13 })));
        }
        else if (shape === 3) {
            return (React.createElement("g", { transform: transform, fill: "#ffffff" },
                React.createElement("rect", { x: 0, y: 7, width: 15, height: 1 }),
                React.createElement("rect", { x: 3, y: 6, width: 9, height: 3 }),
                React.createElement("rect", { x: 5, y: 5, width: 5, height: 5 }),
                React.createElement("rect", { x: 6, y: 3, width: 3, height: 9 }),
                React.createElement("rect", { x: 7, y: 0, width: 1, height: 15 })));
        }
        else {
            throw new Error(`Invalid tickIndex: ${shape}`);
        }
    }
}
exports.default = Flicker;


/***/ }),

/***/ 90:
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

/***/ 91:
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

/***/ 92:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const constants_1 = __webpack_require__(2);
const BrickWall_1 = __webpack_require__(34);
const Text_1 = __webpack_require__(12);
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

/***/ 93:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const Text_1 = __webpack_require__(12);
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

/***/ 94:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(11);
const BrickWall_1 = __webpack_require__(34);
const Text_1 = __webpack_require__(12);
const TextButton_1 = __webpack_require__(95);
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