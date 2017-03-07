import { Map, Repeat } from 'immutable'
import { FIELD_BLOCK_SIZE, N_MAP } from 'utils/constants'
import * as A from 'utils/actions'
import testStage from 'stages/stage-test.json'

const configs = Map({
  test: testStage,
})

const emptyMap = Map({
  bricks: Repeat(false, N_MAP.BRICK ** 2).toList(),
  steels: Repeat(false, N_MAP.STEEL ** 2).toList(),
  rivers: Repeat(false, N_MAP.RIVER ** 2).toList(),
  snows: Repeat(false, N_MAP.SNOW ** 2).toList(),
  forests: Repeat(false, N_MAP.FOREST ** 2).toList(),
})

const mapInitialState = emptyMap

// todo eagle的坐标也应该从json文件中导入
export default function mapReducer(state = mapInitialState, action) {
  if (action.type === A.LOAD_STAGE) {
    const { name } = action
    return parseStageConfig(configs.get(name))
  } else if (action.type === A.DESTROY_BRICKS) {
    return state.update('bricks', bricks => (
      bricks.map((set, t) => (action.ts.has(t) ? false : set)))
    )
  } else if (action.type === A.DESTROY_STEELS) {
    return state.update('steels', steels => (
      steels.map((set, t) => (action.ts.has(t) ? false : set)))
    )
  } else {
    return state
  }
}

// 空白 XX
// 砖块 brick  B<n>
// 河流 river  R
// 雪地 snow   S
// 森林 forest F
// 钢块 steel  T<n>
// 老鹰 eagle  E
// todo 优化代码
function parseStageConfig(config) {
  const map = config.map
  const bricks = new Set()
  const steels = new Set()
  const rivers = new Set()
  const snows = new Set()
  const forests = new Set()
  for (let row = 0; row < FIELD_BLOCK_SIZE; row += 1) {
    const line = map[row].toLowerCase().split(/ +/)
    for (let col = 0; col < FIELD_BLOCK_SIZE; col += 1) {
      const item = line[col]
      if (item[0] === 'b') {
        const bits = parseInt(item[1], 16)
        // console.assert(0 < bits && bits < 16)
        const rowrow = 4 * row
        const colcol = 4 * col
        const N = 52
        if (bits & 0b0001) {
          bricks.add(rowrow * N + colcol + 0)
          bricks.add(rowrow * N + colcol + 1)
          bricks.add(rowrow * N + colcol + N)
          bricks.add(rowrow * N + colcol + N + 1)
        }
        if (bits & 0b0010) {
          bricks.add(rowrow * N + colcol + 2 + 0)
          bricks.add(rowrow * N + colcol + 2 + 1)
          bricks.add(rowrow * N + colcol + 2 + N)
          bricks.add(rowrow * N + colcol + 2 + N + 1)
        }
        if (bits & 0b0100) {
          bricks.add((rowrow + 2) * N + colcol + 0)
          bricks.add((rowrow + 2) * N + colcol + 1)
          bricks.add((rowrow + 2) * N + colcol + N)
          bricks.add((rowrow + 2) * N + colcol + N + 1)
        }
        if (bits & 0b1000) {
          bricks.add((rowrow + 2) * N + colcol + 2 + 0)
          bricks.add((rowrow + 2) * N + colcol + 2 + 1)
          bricks.add((rowrow + 2) * N + colcol + 2 + N)
          bricks.add((rowrow + 2) * N + colcol + 2 + N + 1)
        }
      } else if (item[0] === 't') {
        const bits = parseInt(item[1], 16)
        // console.assert(0 < bits && bits < 16)
        if (bits & 0b0001) {
          steels.add(2 * row * 26 + 2 * col)
        }
        if (bits & 0b0010) {
          steels.add(2 * row * 26 + 2 * col + 1)
        }
        if (bits & 0b0100) {
          steels.add((2 * row + 1) * 26 + 2 * col)
        }
        if (bits & 0b1000) {
          steels.add((2 * row + 1) * 26 + 2 * col + 1)
        }
      } else if (item[0] === 'r') {
        rivers.add(row * FIELD_BLOCK_SIZE + col)
      } else if (item[0] === 'f') {
        forests.add(row * FIELD_BLOCK_SIZE + col)
      } else if (item[0] === 's') {
        snows.add(row * FIELD_BLOCK_SIZE + col)
      } else if (item[0] !== 'e' && item[0] !== 'x') {
        throw new Error()
      }
    }
  }

  return Map({
    bricks: Repeat(false, N_MAP.BRICK ** 2)
      .map((set, index) => bricks.has(index)).toList(),
    steels: Repeat(false, N_MAP.STEEL ** 2)
      .map((set, index) => steels.has(index)).toList(),
    rivers: Repeat(false, N_MAP.RIVER ** 2)
      .map((set, index) => rivers.has(index)).toList(),
    snows: Repeat(false, N_MAP.SNOW ** 2)
      .map((set, index) => snows.has(index)).toList(),
    forests: Repeat(false, N_MAP.FOREST ** 2)
      .map((set, index) => forests.has(index)).toList(),
  })
}
