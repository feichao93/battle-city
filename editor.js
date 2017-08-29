webpackJsonp([2],{

/***/ 358:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(51);
const file_saver_1 = __webpack_require__(359);
const React = __webpack_require__(0);
const ReactDOM = __webpack_require__(52);
const redux_saga_1 = __webpack_require__(17);
const redux_1 = __webpack_require__(40);
const immutable_1 = __webpack_require__(5);
const react_redux_1 = __webpack_require__(12);
const constants_1 = __webpack_require__(2);
const BrickLayer_1 = __webpack_require__(81);
const SteelLayer_1 = __webpack_require__(82);
const RiverLayer_1 = __webpack_require__(83);
const SnowLayer_1 = __webpack_require__(84);
const ForestLayer_1 = __webpack_require__(85);
const Eagle_1 = __webpack_require__(86);
const Text_1 = __webpack_require__(10);
const River_1 = __webpack_require__(154);
const Snow_1 = __webpack_require__(155);
const Forest_1 = __webpack_require__(156);
const tanks_1 = __webpack_require__(24);
const BrickWall_1 = __webpack_require__(34);
const SteelWall_1 = __webpack_require__(153);
const TextInput_1 = __webpack_require__(362);
const TextButton_1 = __webpack_require__(94);
const tickEmitter_1 = __webpack_require__(76);
const index_1 = __webpack_require__(49);
const game_1 = __webpack_require__(73);
const parseStageMap_1 = __webpack_require__(75);
const types_1 = __webpack_require__(9);
const common_1 = __webpack_require__(6);
const simpleSagaMiddleware = redux_saga_1.default();
const simpleReducer = redux_1.combineReducers({ time: index_1.time, game: game_1.default });
const simpleStore = redux_1.createStore(simpleReducer, undefined, redux_1.applyMiddleware(simpleSagaMiddleware));
simpleSagaMiddleware.run(tickEmitter_1.default);
const zoomLevel = 2;
const totalWidth = 16 * constants_1.BLOCK_SIZE;
const totalHeight = 15 * constants_1.BLOCK_SIZE;
function incTankLevel(record) {
    if (record.tankLevel === 'basic') {
        return record.set('tankLevel', 'fast');
    }
    else if (record.tankLevel === 'fast') {
        return record.set('tankLevel', 'power');
    }
    else {
        return record.set('tankLevel', 'armor');
    }
}
function decTankLevel(record) {
    if (record.tankLevel === 'armor') {
        return record.set('tankLevel', 'power');
    }
    else if (record.tankLevel === 'power') {
        return record.set('tankLevel', 'fast');
    }
    else {
        return record.set('tankLevel', 'basic');
    }
}
function toString(list) {
    const result = [];
    for (let row = 0; row < constants_1.FIELD_BLOCK_SIZE; row += 1) {
        const array = [];
        for (let col = 0; col < constants_1.FIELD_BLOCK_SIZE; col += 1) {
            const { type, hex } = list.get(row * constants_1.FIELD_BLOCK_SIZE + col);
            if (type === 'B') {
                if (hex > 0) {
                    array.push('B' + hex.toString(16));
                }
                else {
                    array.push('X');
                }
            }
            else if (type === 'E') {
                array.push('E');
            }
            else if (type === 'R') {
                array.push('R');
            }
            else if (type === 'S') {
                array.push('S');
            }
            else if (type === 'T') {
                if (hex > 0) {
                    array.push('T' + hex.toString(16));
                }
                else {
                    array.push('X');
                }
            }
            else if (type === 'F') {
                array.push('F');
            }
            else {
                array.push('X');
            }
        }
        result.push(array.map(s => s.padEnd(3)).join(''));
    }
    return result;
}
exports.MapItemRecord = immutable_1.Record({
    type: 'X',
    hex: 0xF,
});
const mapItemRecord = exports.MapItemRecord();
exports.PopupRecord = immutable_1.Record({
    type: 'none',
    message: '',
});
const popupRecord = exports.PopupRecord();
exports.EnemyConfigRecord = immutable_1.Record({
    tankLevel: 'basic',
    count: 0,
});
const enemyConfigRecord = exports.EnemyConfigRecord();
class DashLines extends React.PureComponent {
    render() {
        const { t } = this.props;
        const hrow = Math.floor(t / constants_1.FIELD_BLOCK_SIZE);
        const hcol = t % constants_1.FIELD_BLOCK_SIZE;
        return (React.createElement("g", { className: "dash-lines", stroke: "steelblue", strokeWidth: "0.5", strokeDasharray: "2 2" },
            immutable_1.Range(1, constants_1.FIELD_BLOCK_SIZE + 1).map(col => React.createElement("line", { key: col, x1: constants_1.BLOCK_SIZE * col, y1: 0, x2: constants_1.BLOCK_SIZE * col, y2: totalHeight, strokeOpacity: (hcol === col || hcol === col - 1) ? 1 : 0.3 })).toArray(),
            immutable_1.Range(1, constants_1.FIELD_BLOCK_SIZE + 1).map(row => React.createElement("line", { key: row, x1: 0, y1: constants_1.BLOCK_SIZE * row, x2: totalWidth, y2: constants_1.BLOCK_SIZE * row, strokeOpacity: (hrow === row || hrow === row - 1) ? 1 : 0.3 })).toArray()));
    }
}
const HexBrickWall = ({ x, y, hex }) => (React.createElement("g", { role: "hex-brick-wall" }, [[0b0001, 0, 0], [0b0010, 8, 0], [0b0100, 0, 8], [0b1000, 8, 8]].map(([mask, dx, dy], index) => React.createElement("g", { key: index, style: { opacity: (hex & mask) ? 1 : 0.3 }, transform: `translate(${dx},${dy})` },
    React.createElement(BrickWall_1.default, { x: x, y: y }),
    React.createElement(BrickWall_1.default, { x: x + 4, y: y }),
    React.createElement(BrickWall_1.default, { x: x, y: y + 4 }),
    React.createElement(BrickWall_1.default, { x: x + 4, y: y + 4 })))));
const HexSteelWall = ({ x, y, hex }) => (React.createElement("g", { role: "hex-steel-wall" },
    React.createElement(SteelWall_1.default, { x: x, y: y, gstyle: { opacity: (hex & 0b0001) ? 1 : 0.3 } }),
    React.createElement(SteelWall_1.default, { x: x + 8, y: y, gstyle: { opacity: (hex & 0b0010) ? 1 : 0.3 } }),
    React.createElement(SteelWall_1.default, { x: x, y: y + 8, gstyle: { opacity: (hex & 0b0100) ? 1 : 0.3 } }),
    React.createElement(SteelWall_1.default, { x: x + 8, y: y + 8, gstyle: { opacity: (hex & 0b1000) ? 1 : 0.3 } })));
const AreaButton = ({ x, y, width, height, onClick, strokeWidth = 1, spreadX = 2, spreadY = 1, }) => {
    return (React.createElement("rect", { className: "area-button", x: x - spreadX, y: y - spreadY, width: width + 2 * spreadX, height: height + 2 * spreadY, onClick: onClick, stroke: "transparent", strokeWidth: strokeWidth }));
};
// todo 针对单词进行换行
const TextWithLineWrap = ({ x, y, fill, maxLength, content, lineSpacing = 0.25 * constants_1.BLOCK_SIZE }) => (React.createElement("g", { role: "text-with-line-wrap" }, immutable_1.Range(0, Math.ceil(content.length / maxLength)).map(index => React.createElement(Text_1.default, { key: index, x: x, y: y + (0.5 * constants_1.BLOCK_SIZE + lineSpacing) * index, fill: fill, content: content.substring(index * maxLength, (index + 1) * maxLength) })).toArray()));
const positionMap = {
    X: constants_1.BLOCK_SIZE,
    B: 2.5 * constants_1.BLOCK_SIZE,
    T: 4 * constants_1.BLOCK_SIZE,
    R: 5.5 * constants_1.BLOCK_SIZE,
    S: 7 * constants_1.BLOCK_SIZE,
    F: 8.5 * constants_1.BLOCK_SIZE,
    E: 10 * constants_1.BLOCK_SIZE,
};
class Editor extends React.Component {
    constructor() {
        super(...arguments);
        this.pressed = false;
        this.resolveConfirm = null;
        this.resolveAlert = null;
        this.state = {
            view: 'config',
            popup: popupRecord,
            t: -1,
            // map-view
            map: immutable_1.Repeat(mapItemRecord, constants_1.FIELD_BLOCK_SIZE ** 2).toList(),
            itemType: 'X',
            brickHex: 0xf,
            steelHex: 0xf,
            // config-view
            stageName: '',
            difficulty: 1,
            enemies: immutable_1.List([
                exports.EnemyConfigRecord({ tankLevel: 'basic', count: 10 }),
                exports.EnemyConfigRecord({ tankLevel: 'fast', count: 4 }),
                exports.EnemyConfigRecord({ tankLevel: 'power', count: 4 }),
                exports.EnemyConfigRecord({ tankLevel: 'armor', count: 2 }),
            ]),
        };
        this.onLoadFile = () => {
            const file = this.input.files[0];
            if (file == null) {
                return;
            }
            const fileReader = new FileReader();
            fileReader.readAsText(file);
            fileReader.onloadend = () => {
                try {
                    const stage = JSON.parse(fileReader.result);
                    this.loadStateFromFileContent(stage);
                }
                catch (error) {
                    this.showAlertPopup('Failed to open file.');
                }
                this.resetButton.click();
            };
        };
        this.onMouseDown = (event) => {
            const { view, popup } = this.state;
            if (view === 'map' && popup.type === 'none' && this.getT(event) !== -1) {
                this.pressed = true;
            }
        };
        this.onMouseMove = (event) => {
            const { view, popup, t: lastT } = this.state;
            const t = this.getT(event);
            if (t !== lastT) {
                this.setState({ t });
            }
            if (view === 'map' && popup.type === 'none' && this.pressed) {
                this.setAsCurrentItem(t);
            }
        };
        this.onMouseUp = (event) => {
            this.pressed = false;
            const { view, popup } = this.state;
            if (view === 'map' && popup.type === 'none') {
                this.setAsCurrentItem(this.getT(event));
            }
        };
        this.onMouseLeave = () => {
            this.pressed = false;
            this.setState({ t: -1 });
        };
        this.onChangeView = (view) => this.setState({ view });
        this.onIncDifficulty = () => {
            const { difficulty } = this.state;
            this.setState({ difficulty: difficulty + 1 });
        };
        this.onDecDifficulty = () => {
            const { difficulty } = this.state;
            this.setState({ difficulty: difficulty - 1 });
        };
        this.onIncEnemyLevel = (index) => {
            const { enemies } = this.state;
            this.setState({ enemies: enemies.update(index, incTankLevel) });
        };
        this.onDecEnemyLevel = (index) => {
            const { enemies } = this.state;
            this.setState({ enemies: enemies.update(index, decTankLevel) });
        };
        this.onIncEnemyCount = (index) => {
            const { enemies } = this.state;
            this.setState({ enemies: enemies.updateIn([index, 'count'], common_1.inc(1)) });
        };
        this.onDecEnemyCount = (index) => {
            const { enemies } = this.state;
            this.setState({ enemies: enemies.updateIn([index, 'count'], common_1.dec(1)) });
        };
        this.onRequestLoad = () => {
            this.input.click();
        };
        this.onSave = async () => {
            const { map, stageName, enemies, difficulty } = this.state;
            const totalEnemyCount = enemies.map(e => e.count).reduce((x, y) => x + y);
            // 检查stageName
            if (stageName === '') {
                await this.showAlertPopup('Please enter stage name.');
                this.setState({ view: 'config' });
                return;
            }
            // 检查enemies数量
            if (totalEnemyCount === 0) {
                this.showAlertPopup('no enemy');
                return;
            }
            else if (totalEnemyCount !== 20 &&
                !await this.showConfirmPopup('total enemy count is not 20. continue?')) {
                return;
            }
            // 检查地图
            const hasEagle = map.some(mapItem => mapItem.type === 'E');
            if (!hasEagle && !await this.showConfirmPopup('no eagle. continue?')) {
                return;
            }
            const content = JSON.stringify({
                name: stageName.toLowerCase(),
                difficulty,
                map: toString(map),
                enemies: enemies.filter(e => e.count > 0)
                    .map(e => `${e.count}*${e.tankLevel}`),
            }, null, 2);
            file_saver_1.saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), `stage-${stageName}.json`);
        };
        this.onConfirm = () => {
            this.resolveConfirm(true);
            this.resolveConfirm = null;
            this.setState({ popup: popupRecord });
        };
        this.onCancel = () => {
            this.resolveConfirm(false);
            this.resolveConfirm = null;
            this.setState({ popup: popupRecord });
        };
        this.onClickOkOfAlert = () => {
            this.resolveAlert();
            this.resolveAlert = null;
            this.setState({ popup: popupRecord });
        };
        this.onShowHelpInfo = async () => {
            await this.showAlertPopup('1. Choose an item type below.');
            await this.showAlertPopup('2. Click or pan in the left.');
            await this.showAlertPopup('3. After selecting Brick or Steel you can change the item shape');
        };
    }
    componentDidMount() {
        this.form = document.createElement('form');
        this.resetButton = document.createElement('input');
        this.input = document.createElement('input');
        this.resetButton.type = 'reset';
        this.input.type = 'file';
        this.form.style.display = 'none';
        this.input.addEventListener('change', this.onLoadFile);
        this.form.appendChild(this.input);
        this.form.appendChild(this.resetButton);
        document.body.appendChild(this.form);
    }
    componentWillUnmount() {
        this.input.removeEventListener('change', this.onLoadFile);
        this.form.remove();
    }
    async loadStateFromFileContent(stage) {
        const stageName = stage.name;
        const difficulty = stage.difficulty;
        const enemies = immutable_1.List(stage.enemies.map(line => {
            const splited = line.split('*');
            return exports.EnemyConfigRecord({
                count: Number(splited[0]),
                tankLevel: splited[1],
            });
        })).setSize(4).map(v => v ? v : enemyConfigRecord);
        const map = immutable_1.List(stage.map).flatMap(line => {
            const items = line.trim().split(/ +/);
            return items.map(item => {
                const hex = parseInt(item[1], 16);
                return exports.MapItemRecord({
                    type: item[0],
                    hex: isNaN(hex) ? 0 : hex,
                });
            });
        });
        if (await this.showConfirmPopup('This will override current config and map. Continue?')) {
            this.setState({ stageName, difficulty, enemies, map });
        }
    }
    getT(event) {
        let totalTop = 0;
        let totalLeft = 0;
        let node = this.svg;
        while (node) {
            totalTop += node.scrollTop + node.clientTop;
            totalLeft += node.scrollLeft + node.clientLeft;
            node = node.parentElement;
        }
        const row = Math.floor((event.clientY + totalTop - this.svg.clientTop) / zoomLevel / constants_1.BLOCK_SIZE);
        const col = Math.floor((event.clientX + totalLeft - this.svg.clientLeft) / zoomLevel / constants_1.BLOCK_SIZE);
        if (row >= 0 && row < constants_1.FIELD_BLOCK_SIZE && col >= 0 && col < constants_1.FIELD_BLOCK_SIZE) {
            return row * constants_1.FIELD_BLOCK_SIZE + col;
        }
        else {
            return -1;
        }
    }
    getCurrentItem() {
        const { itemType, brickHex, steelHex } = this.state;
        if (itemType === 'B') {
            return exports.MapItemRecord({ type: 'B', hex: brickHex });
        }
        else if (itemType === 'T') {
            return exports.MapItemRecord({ type: 'T', hex: steelHex });
        }
        else {
            return exports.MapItemRecord({ type: itemType });
        }
    }
    setAsCurrentItem(t) {
        const { map } = this.state;
        const item = this.getCurrentItem();
        if (t == -1 || immutable_1.is(map.get(t), item)) {
            return;
        }
        if (item.type === 'E') {
            // 先将已存在的eagle移除 保证Eagle最多出现一次
            const eagleRemoved = map.map(item => (item.type === 'E' ? mapItemRecord : item));
            this.setState({ map: eagleRemoved.set(t, item) });
        }
        else {
            this.setState({ map: map.set(t, item) });
        }
    }
    showAlertPopup(message) {
        this.setState({
            popup: exports.PopupRecord({
                type: 'alert',
                message,
            }),
        });
        return new Promise(resolve => {
            this.resolveAlert = resolve;
        });
    }
    showConfirmPopup(message) {
        this.setState({
            popup: exports.PopupRecord({
                type: 'confirm',
                message,
            })
        });
        return new Promise(resolve => {
            this.resolveConfirm = resolve;
        });
    }
    renderItemSwitchButtons() {
        return (React.createElement("g", { role: "item-switch-buttons" }, Object.entries(positionMap).map(([type, y]) => React.createElement(AreaButton, { key: type, x: 0.25 * constants_1.BLOCK_SIZE, y: y, width: 2.5 * constants_1.BLOCK_SIZE, height: constants_1.BLOCK_SIZE, onClick: () => this.setState({ itemType: type }) }))));
    }
    renderHexAdjustButtons() {
        const { itemType, brickHex, steelHex } = this.state;
        let brickHexAdjustButtons = null;
        let steelHexAdjustButtons = null;
        if (itemType === 'B') {
            brickHexAdjustButtons = [0b0001, 0b0010, 0b0100, 0b1000].map(bin => React.createElement(AreaButton, { key: bin, x: constants_1.BLOCK_SIZE + ((bin & 0b1010) ? 0.5 * constants_1.BLOCK_SIZE : 0), y: 2.5 * constants_1.BLOCK_SIZE + ((bin & 0b1100) ? 0.5 * constants_1.BLOCK_SIZE : 0), width: 0.5 * constants_1.BLOCK_SIZE, height: 0.5 * constants_1.BLOCK_SIZE, spreadX: 0, spreadY: 0, onClick: () => this.setState({ brickHex: brickHex ^ bin }) }));
        }
        if (itemType === 'T') {
            steelHexAdjustButtons = [0b0001, 0b0010, 0b0100, 0b1000].map(bin => React.createElement(AreaButton, { key: bin, x: constants_1.BLOCK_SIZE + ((bin & 0b1010) ? 0.5 * constants_1.BLOCK_SIZE : 0), y: 4 * constants_1.BLOCK_SIZE + ((bin & 0b1100) ? 0.5 * constants_1.BLOCK_SIZE : 0), width: 0.5 * constants_1.BLOCK_SIZE, height: 0.5 * constants_1.BLOCK_SIZE, spreadX: 0, spreadY: 0, onClick: () => this.setState({ steelHex: steelHex ^ bin }) }));
        }
        return (React.createElement("g", { role: "hex-adjust-buttons" },
            brickHexAdjustButtons,
            steelHexAdjustButtons,
            itemType === 'B' ?
                React.createElement(TextButton_1.default, { content: "f", spreadX: 0.125 * constants_1.BLOCK_SIZE, x: 2.25 * constants_1.BLOCK_SIZE, y: 2.75 * constants_1.BLOCK_SIZE, onClick: () => this.setState({ itemType: 'B', brickHex: 0xf }) })
                : null,
            itemType === 'T' ?
                React.createElement(TextButton_1.default, { content: "f", spreadX: 0.125 * constants_1.BLOCK_SIZE, x: 2.25 * constants_1.BLOCK_SIZE, y: 4.25 * constants_1.BLOCK_SIZE, onClick: () => this.setState({ itemType: 'T', steelHex: 0xf }) })
                : null));
    }
    renderMapView() {
        const { map, brickHex, steelHex, itemType, t } = this.state;
        const { rivers, steels, bricks, snows, forests, eagle } = parseStageMap_1.default(toString(map));
        return (React.createElement("g", { role: "map-view" },
            React.createElement("g", { role: "board" },
                React.createElement("rect", { width: constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE, height: constants_1.FIELD_BLOCK_SIZE * constants_1.BLOCK_SIZE, fill: "#000000" }),
                React.createElement(RiverLayer_1.default, { rivers: rivers }),
                React.createElement(SteelLayer_1.default, { steels: steels }),
                React.createElement(BrickLayer_1.default, { bricks: bricks }),
                React.createElement(SnowLayer_1.default, { snows: snows }),
                eagle ?
                    React.createElement(Eagle_1.default, { x: eagle.x, y: eagle.y, broken: eagle.broken })
                    : null,
                React.createElement(ForestLayer_1.default, { forests: forests })),
            React.createElement(DashLines, { t: t }),
            React.createElement("g", { role: "tools", transform: `translate(${13 * constants_1.BLOCK_SIZE},0)` },
                React.createElement(TextButton_1.default, { content: "?", x: 2.25 * constants_1.BLOCK_SIZE, y: 0.25 * constants_1.BLOCK_SIZE, spreadX: 0.05 * constants_1.BLOCK_SIZE, spreadY: 0.05 * constants_1.BLOCK_SIZE, onClick: this.onShowHelpInfo }),
                React.createElement(Text_1.default, { content: '\u2192', fill: "#E91E63", x: 0.25 * constants_1.BLOCK_SIZE, y: 0.25 * constants_1.BLOCK_SIZE + positionMap[itemType] }),
                React.createElement("rect", { x: constants_1.BLOCK_SIZE, y: constants_1.BLOCK_SIZE, width: constants_1.BLOCK_SIZE, height: constants_1.BLOCK_SIZE, fill: "black" }),
                React.createElement(HexBrickWall, { x: constants_1.BLOCK_SIZE, y: 2.5 * constants_1.BLOCK_SIZE, hex: brickHex }),
                React.createElement(HexSteelWall, { x: constants_1.BLOCK_SIZE, y: 4 * constants_1.BLOCK_SIZE, hex: steelHex }),
                React.createElement(River_1.default, { shape: 0, x: constants_1.BLOCK_SIZE, y: 5.5 * constants_1.BLOCK_SIZE }),
                React.createElement(Snow_1.default, { x: constants_1.BLOCK_SIZE, y: 7 * constants_1.BLOCK_SIZE }),
                React.createElement(Forest_1.default, { x: constants_1.BLOCK_SIZE, y: 8.5 * constants_1.BLOCK_SIZE }),
                React.createElement(Eagle_1.default, { x: constants_1.BLOCK_SIZE, y: 10 * constants_1.BLOCK_SIZE, broken: false }),
                this.renderItemSwitchButtons(),
                this.renderHexAdjustButtons())));
    }
    renderConfigView() {
        const { enemies, difficulty, stageName, t } = this.state;
        const totalEnemyCount = enemies.map(e => e.count).reduce((x, y) => x + y);
        return (React.createElement("g", { role: "config-view" },
            React.createElement(DashLines, { t: t }),
            React.createElement(Text_1.default, { content: "name:", x: 3.5 * constants_1.BLOCK_SIZE, y: 1 * constants_1.BLOCK_SIZE, fill: "#ccc" }),
            React.createElement(TextInput_1.default, { x: 6.5 * constants_1.BLOCK_SIZE, y: constants_1.BLOCK_SIZE, maxLength: 12, value: stageName, onChange: stageName => this.setState({ stageName }) }),
            React.createElement(Text_1.default, { content: "difficulty:", x: 0.5 * constants_1.BLOCK_SIZE, y: 2.5 * constants_1.BLOCK_SIZE, fill: "#ccc" }),
            React.createElement(TextButton_1.default, { content: "-", x: 6.25 * constants_1.BLOCK_SIZE, y: 2.5 * constants_1.BLOCK_SIZE, disabled: difficulty === 1, onClick: this.onDecDifficulty }),
            React.createElement(Text_1.default, { content: String(difficulty), x: 7.25 * constants_1.BLOCK_SIZE, y: 2.5 * constants_1.BLOCK_SIZE, fill: "#ccc" }),
            React.createElement(TextButton_1.default, { content: "+", x: 8.25 * constants_1.BLOCK_SIZE, y: 2.5 * constants_1.BLOCK_SIZE, disabled: difficulty === 4, onClick: this.onIncDifficulty }),
            React.createElement(Text_1.default, { content: "enemies:", x: 2 * constants_1.BLOCK_SIZE, y: 4 * constants_1.BLOCK_SIZE, fill: "#ccc" }),
            React.createElement("g", { role: "enemies-config", transform: `translate(${6 * constants_1.BLOCK_SIZE}, ${4 * constants_1.BLOCK_SIZE})` },
                enemies.map(({ tankLevel, count }, index) => (React.createElement("g", { key: index, transform: `translate(0, ${1.5 * constants_1.BLOCK_SIZE * index})` },
                    React.createElement(TextButton_1.default, { content: '\u2190', x: 0.25 * constants_1.BLOCK_SIZE, y: 0.25 * constants_1.BLOCK_SIZE, disabled: tankLevel === 'basic', onClick: () => this.onDecEnemyLevel(index) }),
                    React.createElement(tanks_1.Tank, { tank: types_1.TankRecord({ side: 'ai', level: tankLevel, x: constants_1.BLOCK_SIZE, y: 0 }) }),
                    React.createElement(TextButton_1.default, { content: '\u2192', x: 2.25 * constants_1.BLOCK_SIZE, y: 0.25 * constants_1.BLOCK_SIZE, disabled: tankLevel === 'armor', onClick: () => this.onIncEnemyLevel(index) }),
                    React.createElement(TextButton_1.default, { content: "-", x: 3.75 * constants_1.BLOCK_SIZE, y: 0.25 * constants_1.BLOCK_SIZE, disabled: count === 0, onClick: () => this.onDecEnemyCount(index) }),
                    React.createElement(Text_1.default, { content: String(count).padStart(2, '0'), x: 4.5 * constants_1.BLOCK_SIZE, y: 0.25 * constants_1.BLOCK_SIZE, fill: "#ccc" }),
                    React.createElement(TextButton_1.default, { content: "+", x: 5.75 * constants_1.BLOCK_SIZE, y: 0.25 * constants_1.BLOCK_SIZE, disabled: count === 99, onClick: () => this.onIncEnemyCount(index) })))),
                React.createElement(Text_1.default, { content: "total:", x: 0.25 * constants_1.BLOCK_SIZE, y: 6 * constants_1.BLOCK_SIZE, fill: "#ccc" }),
                React.createElement(Text_1.default, { content: String(totalEnemyCount).padStart(2, '0'), x: 4.5 * constants_1.BLOCK_SIZE, y: 6 * constants_1.BLOCK_SIZE, fill: "#ccc" }))));
    }
    renderPopup() {
        const { popup } = this.state;
        if (popup.type === 'alert') {
            return (React.createElement("g", { role: "popup-alert" },
                React.createElement("rect", { x: 0, y: 0, width: totalWidth, height: totalHeight, fill: "transparent" }),
                React.createElement("g", { transform: `translate(${2.5 * constants_1.BLOCK_SIZE}, ${4.5 * constants_1.BLOCK_SIZE})` },
                    React.createElement("rect", { x: -0.5 * constants_1.BLOCK_SIZE, y: -0.5 * constants_1.BLOCK_SIZE, width: 12 * constants_1.BLOCK_SIZE, height: 4 * constants_1.BLOCK_SIZE, fill: "#e91e63" }),
                    React.createElement(TextWithLineWrap, { x: 0, y: 0, fill: "#333", maxLength: 22, content: popup.message }),
                    React.createElement(TextButton_1.default, { x: 9.5 * constants_1.BLOCK_SIZE, y: 2.25 * constants_1.BLOCK_SIZE, textFill: "#333", content: "OK", onClick: this.onClickOkOfAlert }))));
        }
        else if (popup.type === 'confirm') {
            return (React.createElement("g", { role: "popup-confirm" },
                React.createElement("rect", { x: 0, y: 0, width: totalWidth, height: totalHeight, fill: "transparent" }),
                React.createElement("g", { transform: `translate(${2.5 * constants_1.BLOCK_SIZE}, ${4.5 * constants_1.BLOCK_SIZE})` },
                    React.createElement("rect", { x: -0.5 * constants_1.BLOCK_SIZE, y: -0.5 * constants_1.BLOCK_SIZE, width: 12 * constants_1.BLOCK_SIZE, height: 4 * constants_1.BLOCK_SIZE, fill: "#e91e63" }),
                    React.createElement(TextWithLineWrap, { x: 0, y: 0, fill: "#333", maxLength: 22, content: popup.message }),
                    React.createElement(TextButton_1.default, { x: 7.5 * constants_1.BLOCK_SIZE, y: 2 * constants_1.BLOCK_SIZE, textFill: "#333", content: "no", onClick: this.onCancel }),
                    React.createElement(TextButton_1.default, { x: 9 * constants_1.BLOCK_SIZE, y: 2 * constants_1.BLOCK_SIZE, textFill: "#333", content: "yes", onClick: this.onConfirm }))));
        }
        else {
            return null;
        }
    }
    render() {
        const { view } = this.state;
        return (React.createElement("svg", { ref: node => (this.svg = node), className: "svg", style: { background: '#333' }, width: totalWidth * zoomLevel, height: totalHeight * zoomLevel, viewBox: `0 0 ${totalWidth} ${totalHeight}`, onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onMouseMove: this.onMouseMove, onMouseLeave: this.onMouseLeave },
            view === 'map' ? this.renderMapView() : null,
            view === 'config' ? this.renderConfigView() : null,
            React.createElement("g", { role: "menu", transform: `translate(0, ${13 * constants_1.BLOCK_SIZE})` },
                React.createElement(TextButton_1.default, { content: "config", x: 0.5 * constants_1.BLOCK_SIZE, y: 0.5 * constants_1.BLOCK_SIZE, selected: view === 'config', onClick: () => this.onChangeView('config') }),
                React.createElement(TextButton_1.default, { content: "map", x: 4 * constants_1.BLOCK_SIZE, y: 0.5 * constants_1.BLOCK_SIZE, selected: view === 'map', onClick: () => this.onChangeView('map') }),
                React.createElement(TextButton_1.default, { content: "load", x: 7 * constants_1.BLOCK_SIZE, y: 0.5 * constants_1.BLOCK_SIZE, onClick: this.onRequestLoad }),
                React.createElement(TextButton_1.default, { content: "save", x: 9.5 * constants_1.BLOCK_SIZE, y: 0.5 * constants_1.BLOCK_SIZE, onClick: this.onSave })),
            this.renderPopup()));
    }
}
ReactDOM.render(React.createElement(react_redux_1.Provider, { store: simpleStore },
    React.createElement(Editor, null)), document.getElementById('container'));


/***/ }),

/***/ 359:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if (("function" !== "undefined" && __webpack_require__(360) !== null) && (__webpack_require__(361) !== null)) {
  !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
    return saveAs;
  }.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}


/***/ }),

/***/ 360:
/***/ (function(module, exports) {

module.exports = function() {
	throw new Error("define cannot be used indirect");
};


/***/ }),

/***/ 361:
/***/ (function(module, exports) {

/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {/* globals __webpack_amd_options__ */
module.exports = __webpack_amd_options__;

/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }),

/***/ 362:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const Text_1 = __webpack_require__(10);
const constants_1 = __webpack_require__(2);
class TextInput extends React.Component {
    constructor(props) {
        super(props);
        this.onFocus = () => {
            this.setState({ focused: true });
        };
        this.onBlur = () => {
            this.setState({ focused: false });
        };
        this.onKeyDown = (event) => {
            const { value, onChange, maxLength } = this.props;
            if (event.key === 'Backspace') {
                onChange(value.slice(0, value.length - 1));
            }
            else if (Text_1.default.support(event.key)) {
                onChange((value + event.key).slice(0, maxLength));
            }
        };
        this.state = {
            focused: false,
        };
    }
    render() {
        const { x, y, maxLength, value } = this.props;
        const { focused } = this.state;
        return (React.createElement("g", { tabIndex: 1, onFocus: this.onFocus, onBlur: this.onBlur, onKeyDown: this.onKeyDown, style: { outline: 'none' } },
            React.createElement("rect", { x: x - 2, y: y - 2, height: 0.5 * constants_1.BLOCK_SIZE + 4, width: maxLength * 0.5 * constants_1.BLOCK_SIZE + 4, fill: "transparent", stroke: "#e91e63", strokeOpacity: "0.2", strokeWidth: "1" }),
            React.createElement(Text_1.default, { x: x, y: y, content: value, fill: "#ccc" }),
            React.createElement("rect", { x: x + value.length * 8, y: y - 1.5, width: "1", height: "11", fill: focused ? 'orange' : 'transparent' })));
    }
}
exports.default = TextInput;


/***/ })

},[358]);