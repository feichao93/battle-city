import { Map, Repeat } from 'immutable'
import { FIELD_BLOCK_SIZE, N_MAP } from 'utils/constants'
import * as A from 'utils/actions'
import testStage from 'stages/stage-test.json'

const mapInitialState = parseStageConfig(testStage)

export default function mapReducer(state = mapInitialState, action) {
  if (action.type === A.LOAD_STAGE) {
    return state // todo
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
function parseStageConfig({ map }) {
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
        if (bits & 0b0001) {
          bricks.add(2 * row * 26 + 2 * col)
        }
        if (bits & 0b0010) {
          bricks.add(2 * row * 26 + 2 * col + 1)
        }
        if (bits & 0b0100) {
          bricks.add((2 * row + 1) * 26 + 2 * col)
        }
        if (bits & 0b1000) {
          bricks.add((2 * row + 1) * 26 + 2 * col + 1)
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
