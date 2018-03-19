import * as _ from 'lodash'
import { all, take } from 'redux-saga/effects'
import directionController from 'sagas/directionController'
import fireController from 'sagas/fireController'
import { HumanControllerConfig, Input, TankRecord } from 'types'

const Mousetrap = require('mousetrap')

// 一个humanController实例对应一个人类玩家(用户)的控制器.
// 参数playerName用来指定人类玩家的玩家名称, config为该玩家的操作配置.
// humanController将启动 fireController 与 directionController, 从而控制人类玩家的坦克
export default function* humanController(playerName: string, config: HumanControllerConfig) {
  let firePressing = false // 用来记录当前玩家是否按下了fire键
  let firePressed = false // 用来记录上一个tick内 玩家是否按下过fire键
  Mousetrap.bind(
    config.fire,
    () => {
      firePressing = true
      firePressed = true
    },
    'keydown',
  )
  Mousetrap.bind(config.fire, () => (firePressing = false), 'keyup')

  // 用来记录上一个tick内, 玩家按下过的方向键
  const pressed: Direction[] = []

  function getDirectionControlInfo() {
    if (pressed.length > 0) {
      return { direction: _.last(pressed) }
    } else {
      return { direction: null }
    }
  }

  // 调用该函数用来获取当前玩家的开火操作
  function shouldFire() {
    return firePressing || firePressed
  }

  function bindKeyWithDirection(key: string, direction: Direction) {
    Mousetrap.bind(
      key,
      () => {
        if (pressed.indexOf(direction) === -1) {
          pressed.push(direction)
        }
      },
      'keydown',
    )
    Mousetrap.bind(
      key,
      () => {
        _.pull(pressed, direction)
      },
      'keyup',
    )
  }

  bindKeyWithDirection(config.up, 'up')
  bindKeyWithDirection(config.left, 'left')
  bindKeyWithDirection(config.down, 'down')
  bindKeyWithDirection(config.right, 'right')

  // 调用该函数来获取当前用户的移动操作(坦克级别)
  function getHumanPlayerInput(tank: TankRecord): Input {
    const { direction } = getDirectionControlInfo()
    if (direction != null) {
      if (direction !== tank.direction) {
        return { type: 'turn', direction } as Input
      } else {
        return { type: 'forward' }
      }
    }
  }

  function* resetFirePressedEveryTick() {
    // 每次tick时, 都将firePressed重置
    while (true) {
      yield take('TICK')
      firePressed = false
    }
  }

  yield all([
    directionController(playerName, getHumanPlayerInput),
    fireController(playerName, shouldFire),
    resetFirePressedEveryTick(),
  ])
}
