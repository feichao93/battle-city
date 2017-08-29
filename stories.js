webpackJsonp([1],{

/***/ 357:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(51);
const React = __webpack_require__(0);
const ReactDOM = __webpack_require__(52);
const immutable_1 = __webpack_require__(5);
const react_redux_1 = __webpack_require__(12);
const redux_1 = __webpack_require__(40);
const redux_saga_1 = __webpack_require__(17);
const players_1 = __webpack_require__(74);
const index_1 = __webpack_require__(49);
const game_1 = __webpack_require__(73);
const tanks_1 = __webpack_require__(24);
const SnowLayer_1 = __webpack_require__(84);
const SteelLayer_1 = __webpack_require__(82);
const RiverLayer_1 = __webpack_require__(83);
const BrickLayer_1 = __webpack_require__(81);
const ForestLayer_1 = __webpack_require__(85);
const Text_1 = __webpack_require__(10);
const Eagle_1 = __webpack_require__(86);
const Bullet_1 = __webpack_require__(80);
const Flicker_1 = __webpack_require__(88);
const GameoverScene_1 = __webpack_require__(91);
const GameTitleScene_1 = __webpack_require__(93);
const StatisticsScene_1 = __webpack_require__(92);
const HUD_1 = __webpack_require__(77);
const Score_1 = __webpack_require__(90);
const PowerUp_1 = __webpack_require__(89);
const Explosion_1 = __webpack_require__(87);
const parseStageMap_1 = __webpack_require__(75);
const constants_1 = __webpack_require__(2);
const tickEmitter_1 = __webpack_require__(76);
const index_2 = __webpack_require__(50);
const registerTick_1 = __webpack_require__(25);
const types_1 = __webpack_require__(9);
const BulletExplosion = registerTick_1.default(500, 500, 1000)(Explosion_1.BulletExplosionClass);
const TankExplosion = registerTick_1.default(500, 1000)(Explosion_1.TankExplosionClass);
const PowerUp = ({ name, x, y }) => (React.createElement(PowerUp_1.default, { powerUp: types_1.PowerUpRecord({ powerUpName: name, x, y, visible: true }) }));
const simpleSagaMiddleware = redux_saga_1.default();
const simpleReducer = redux_1.combineReducers({ time: index_1.time, players: players_1.default, game: game_1.default });
const initialState = {
    time: undefined,
    players: immutable_1.Map({
        'player-1': types_1.PlayerRecord({
            playerName: 'player-1',
            lives: 3,
        }),
        'player-2': types_1.PlayerRecord({
            playerName: 'player-2',
            lives: 1,
        }),
    }),
};
const simpleStore = redux_1.createStore(simpleReducer, initialState, redux_1.applyMiddleware(simpleSagaMiddleware));
simpleSagaMiddleware.run(tickEmitter_1.default);
const Transform = ({ dx = 0, dy = 0, k = 1, children }) => (React.createElement("g", { transform: `translate(${dx}, ${dy}) scale(${k})` }, children));
const X4 = ({ width = 64, height = 64, children, style = {} }) => (React.createElement("svg", { className: "svg", width: width, height: height, style: Object.assign({ marginRight: 4 }, style) },
    React.createElement(Transform, { k: 4 }, children)));
const Row = ({ children }) => (React.createElement("div", { style: { display: 'flex' } }, children));
const X8Tank = ({ tank }) => (React.createElement(X4, null,
    React.createElement(tanks_1.Tank, { tank: tank.merge({ x: 0, y: 0 }) })));
const X4Text = ({ content }) => (React.createElement(X4, { width: content.length * 32, height: 32 },
    React.createElement(Text_1.default, { x: 0, y: 0, fill: "#feac4e", content: content })));
const FontLevel1 = ({ children }) => (React.createElement("span", { style: { fontSize: 28, lineHeight: '40px' } }, children));
const colors = ['yellow', 'green', 'silver', 'red'];
const sides = ['ai', 'human'];
const levels = ['basic', 'fast', 'power', 'armor'];
const powerUpNames = ['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel'];
class Stories extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            stage: Object.keys(index_2.default)[0],
        };
    }
    render() {
        const stageNames = Object.keys(index_2.default);
        const { stage } = this.state;
        const { bricks, steels, rivers, snows, forests, eagle } = parseStageMap_1.default(index_2.default[stage].map).toObject();
        return (React.createElement("div", { className: "stories", style: { fontFamily: 'monospace', margin: 8 } },
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "TANKS")),
                sides.map(side => React.createElement("div", { key: side },
                    React.createElement("p", { style: { fontSize: 20, margin: 0, lineHeight: 1.5 } },
                        side,
                        " ",
                        levels.join('/')),
                    React.createElement(Row, null, [0, 1, 2, 3].map(index => React.createElement(X8Tank, { key: index, tank: types_1.TankRecord({
                            side,
                            level: levels[index],
                            color: colors[index],
                        }) }))))),
                React.createElement("div", null,
                    React.createElement("p", { style: { fontSize: 20, margin: 0, lineHeight: 1.5 } }, "armor tank hp 1/2/3/4"),
                    React.createElement(Row, null, [1, 2, 3, 4].map(hp => React.createElement(X8Tank, { key: hp, tank: types_1.TankRecord({
                            side: 'ai',
                            level: 'armor',
                            hp,
                        }) })))),
                React.createElement("div", null,
                    React.createElement("p", { style: { fontSize: 20, margin: 0, lineHeight: 1.5 } }, "tank with power up basic/fast/power/armor"),
                    React.createElement(Row, null, levels.map(level => React.createElement(X8Tank, { key: level, tank: types_1.TankRecord({
                            side: 'ai',
                            level,
                            withPowerUp: true,
                        }) }))))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement("p", { style: { fontSize: 30, lineHeight: '50px', margin: 0 } },
                        "Stage:",
                        React.createElement("select", { value: stage, onChange: e => this.setState({ stage: e.target.value }) }, stageNames.map(name => React.createElement("option", { key: name, value: name },
                            "stage-",
                            name))))),
                React.createElement("svg", { className: "svg", width: constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE * 2, height: constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE * 2, viewBox: `0 0 ${constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE} ${constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE}` },
                    React.createElement("rect", { width: constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE, height: constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE, fill: "#000000" }),
                    React.createElement(RiverLayer_1.default, { rivers: rivers }),
                    React.createElement(SteelLayer_1.default, { steels: steels }),
                    React.createElement(BrickLayer_1.default, { bricks: bricks }),
                    React.createElement(SnowLayer_1.default, { snows: snows }),
                    React.createElement(Eagle_1.default, { x: eagle.x, y: eagle.y, broken: eagle.broken }),
                    React.createElement(ForestLayer_1.default, { forests: forests }))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "Texts")),
                React.createElement(X4Text, { content: "abcdefg" }),
                React.createElement(X4Text, { content: "hijklmn" }),
                React.createElement(X4Text, { content: "opq rst" }),
                React.createElement(X4Text, { content: "uvw xyz" }),
                React.createElement(X4Text, { content: '\u2160 \u2161 \u2190-\u2192' }),
                React.createElement(X4Text, { content: ':+- .\u00a9?' })),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "Bullets & Explosions & Flickers")),
                React.createElement(Row, null,
                    React.createElement(X4, null,
                        React.createElement(Bullet_1.default, { x: 3, y: 3, direction: "up" }),
                        React.createElement(Bullet_1.default, { x: 9, y: 9, direction: "down" })),
                    React.createElement(X4, null,
                        React.createElement(Flicker_1.default, { x: 0, y: 0 }))),
                React.createElement(Row, null,
                    React.createElement(X4, null,
                        React.createElement(Bullet_1.default, { x: 3, y: 3, direction: "left" }),
                        React.createElement(Bullet_1.default, { x: 9, y: 9, direction: "right" })),
                    React.createElement(X4, null,
                        React.createElement(BulletExplosion, { x: 0, y: 0 }))),
                React.createElement(X4, { width: 128, height: 128 },
                    React.createElement(TankExplosion, { x: 0, y: 0 }))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "Scene: game-title")),
                React.createElement("svg", { className: "svg", width: 256 * 1.5, height: 240 * 1.5 },
                    React.createElement(Transform, { k: 1.5 },
                        React.createElement(GameTitleScene_1.default, null)))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "Scene: stage statistics")),
                React.createElement("svg", { className: "svg", width: 256 * 1.5, height: 240 * 1.5 },
                    React.createElement(Transform, { k: 1.5 },
                        React.createElement(StatisticsScene_1.default, null)))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "Scene: gameover")),
                React.createElement("svg", { className: "svg", width: 256 * 1.5, height: 240 * 1.5 },
                    React.createElement(Transform, { k: 1.5 },
                        React.createElement(GameoverScene_1.default, null)))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "HUD")),
                React.createElement("svg", { className: "svg", width: 50, height: 270 },
                    React.createElement(Transform, { k: 2, dx: -232 * 2 + 8, dy: -24 * 2 + 4 },
                        React.createElement(HUD_1.default, null)))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "PowerUp")),
                React.createElement("p", { style: { fontSize: 20, margin: 0, lineHeight: 1.5 } }, "tank / star / grenade / timer / helmet / shoval"),
                React.createElement(X4, { width: 496, height: 96, style: { background: 'black' } }, powerUpNames.map((name, index) => React.createElement(PowerUp, { key: name, name: name, x: index * 24 + 4, y: 4 })))),
            React.createElement("details", { open: true },
                React.createElement("summary", null,
                    React.createElement(FontLevel1, null, "Scores")),
                React.createElement(Row, null,
                    React.createElement(X4, null,
                        React.createElement(Score_1.default, { score: 100 })),
                    React.createElement(X4, null,
                        React.createElement(Score_1.default, { score: 200 })),
                    React.createElement(X4, null,
                        React.createElement(Score_1.default, { score: 300 })),
                    React.createElement(X4, null,
                        React.createElement(Score_1.default, { score: 400 })),
                    React.createElement(X4, null,
                        React.createElement(Score_1.default, { score: 500 }))))));
    }
}
ReactDOM.render(React.createElement(react_redux_1.Provider, { store: simpleStore },
    React.createElement(Stories, null)), document.getElementById('container'));


/***/ }),

/***/ 77:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const react_redux_1 = __webpack_require__(12);
const EnemyCountIndicator_1 = __webpack_require__(78);
const icons_1 = __webpack_require__(79);
const Text_1 = __webpack_require__(10);
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
const Text_1 = __webpack_require__(10);
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
const react_redux_1 = __webpack_require__(12);
const Text_1 = __webpack_require__(10);
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
const react_redux_1 = __webpack_require__(12);
const BrickWall_1 = __webpack_require__(34);
const Text_1 = __webpack_require__(10);
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

},[357]);