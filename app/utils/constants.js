// 一块的大小对应16个像素
export const BLOCK_SIZE = 16
export const HALF_SIZE = BLOCK_SIZE / 2
// 战场的大小 (13block * 13block)
export const FIELD_BSIZE = 13
// 子弹的大小
export const BULLET_SIZE = 3

// 坦克的配色方案
// 共有4种配色方案: 黄色方案, 绿色方案, 银色方案, 红色方案
// 每种配色方案包括三个具体的颜色值, a对应浅色, b对应一般颜色, c对应深色
export const TANK_COLOR_SCHEMES = {
  yellow: {
    a: '#E7E794',
    b: '#E79C21',
    c: '#6B6B00',
  },
  green: {
    a: '#B5F7CE',
    b: '#008C31',
    c: '#005200',
  },
  silver: {
    a: '#FFFFFF',
    b: '#ADADAD',
    c: '#00424A',
  },
  red: {
    a: '#FFFFFF',
    b: '#B53121',
    c: '#5A007B',
  },
}

// 坦克/子弹 方向
export const UP = 'UP'
export const DOWN = 'DOWN'
export const RIGHT = 'RIGHT'
export const LEFT = 'LEFT'

// 砖墙的颜色
export const BRACK_WALL_COLOR_SCHEMES = {
  a: '#6B0800',
  b: '#9C4A00',
  c: '#636363',
}

// 钢墙的颜色
export const STEEL_WALL_COLOR_SCHEMES = {
  a: '#FFFFFF',
  b: '#636363',
  c: '#ADADAD',
}

export const DIRECTION_MAP = {
  [UP]: ['y', 'dec'],
  [DOWN]: ['y', 'inc'],
  [LEFT]: ['x', 'dec'],
  [RIGHT]: ['x', 'inc'],
}
