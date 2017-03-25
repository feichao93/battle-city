import { UP, DOWN, LEFT, RIGHT, BLOCK_SIZE } from 'utils/constants'

// 根据坦克的位置计算子弹的生成位置
// 参数x,y,direction为坦克的位置和方向
export function calculateBulletStartPosition(x, y, direction) {
  if (direction === UP) {
    return { x: x + 6, y: y - 3 }
  } else if (direction === DOWN) {
    return { x: x + 6, y: y + BLOCK_SIZE }
  } else if (direction === LEFT) {
    return { x: x - 3, y: y + 6 }
  } else if (direction === RIGHT) {
    return { x: x + BLOCK_SIZE, y: y + 6 }
  } else {
    throw new Error(`Invalid direction ${direction}`)
  }
}

export function between(min, value, max, threshhold = 0) {
  return min - threshhold <= value && value <= max + threshhold
}

export function getRowCol(t, N) {
  return [Math.floor(t / N), t % N]
}

export function testCollide(subject, object, threshhold = 0) {
  return between(subject.x - object.width, object.x, subject.x + subject.width, threshhold)
    && between(subject.y - object.height, object.y, subject.y + subject.height, threshhold)
}
