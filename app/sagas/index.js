/* eslint-disable */
import Mousetrap from 'mousetrap'
import { eventChannel } from 'redux-saga'
import { fork, take, put } from 'redux-saga/effects'
import { UP, DOWN, LEFT, RIGHT } from 'utils/constants'
import * as A from 'utils/actions'
import * as _ from 'lodash'

const chan = eventChannel((emit) => {
  const pressed = []

  function foo(key, direction) {
    Mousetrap.bind(key, () => {
      const before = pressed.length > 0
      if (!pressed.includes(direction)) {
        pressed.push(direction)
      }
      const after = pressed.length > 0
      if (!before && after) {
        emit({ type: A.START_MOVE })
      }
    }, 'keydown')
    Mousetrap.bind(key, () => {
      const before = pressed.length > 0
      _.pull(pressed, direction)
      const after = pressed.length > 0
      if (before && !after) {
        emit({ type: A.STOP_MOVE })
      }
    }, 'keyup')
  }

  foo('w', UP)
  foo('a', LEFT)
  foo('s', DOWN)
  foo('d', RIGHT)

  const handle = setInterval(() => {
    if (pressed.length > 0) {
      emit({ type: A.MOVE, direction: _.last(pressed) })
    }
  }, 50)

  return function unsubscribe() {
    clearInterval(handle)
    Mousetrap.reset()
  }
})

function* controller() {
  while (true) {
    const action = yield take(chan)
    yield put(action)
  }
}

export default function* rootSaga() {
  console.debug('root saga started')
  yield fork(controller)
}
