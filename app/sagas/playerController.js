import Mousetrap from 'mousetrap'
import { take, fork } from 'redux-saga/effects'
import { UP, DOWN, LEFT, RIGHT } from 'utils/constants'
import * as A from 'utils/actions'
import * as _ from 'lodash'
import directionController from 'sagas/directionController'
import fireController from 'sagas/fireController'

// 一个playerController实例对应一个人类玩家的控制器(键盘或是手柄).
// 参数playerName用来指定人类玩家的玩家名称, config为该玩家的操作配置.
// playerController启动后, 会监听ACTIVATE_PLAYER action.
// 如果action与参数playerName相对应, 则该playerController将启动人类
// 玩家的fireController与directionController, 从而控制人类玩家的坦克
// 通过这样的方式, 我们将<一个操作配置>与<一架坦克>对应起来.
export default function* playerController(playerName, config) {
  let firePressing = false // 用来记录当前玩家是否按下了fire键
  let firePressed = false // 用来记录上一个tick内 玩家是否按下过fire键
  Mousetrap.bind(config.fire, () => {
    firePressing = true
    firePressed = true
  }, 'keydown')
  Mousetrap.bind(config.fire, () => (firePressing = false), 'keyup')

  // 每次tick时, 都将firePressed重置
  yield fork(function* handleTick() {
    while (true) {
      yield take(A.TICK)
      firePressed = false
    }
  })

  // 用来记录上一个tick内, 玩家按下过的方向键
  const pressed = []

  // 调用该函数用来获取当前玩家的移动操作
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

  function bindKeyWithDirection(key, direction) {
    Mousetrap.bind(key, () => {
      if (!pressed.includes(direction)) {
        pressed.push(direction)
      }
    }, 'keydown')
    Mousetrap.bind(key, () => {
      _.pull(pressed, direction)
    }, 'keyup')
  }

  bindKeyWithDirection(config.up, UP)
  bindKeyWithDirection(config.left, LEFT)
  bindKeyWithDirection(config.down, DOWN)
  bindKeyWithDirection(config.right, RIGHT)

  while (true) {
    const action = yield take(A.ACTIVATE_PLAYER)
    if (action.playerName === playerName) {
      yield [
        directionController(playerName, getDirectionControlInfo),
        fireController(playerName, shouldFire),
      ]
    }
    // todo 玩家tank炸了
  }
}
