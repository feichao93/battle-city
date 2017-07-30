import { eventChannel } from 'redux-saga'

export default eventChannel<Action>((emit) => {
  let lastTime = performance.now()
  let requestId = requestAnimationFrame(emitTick)

  function emitTick() {
    const now = performance.now()
    emit({ type: 'TICK', delta: now - lastTime })
    emit({ type: 'AFTER_TICK', delta: now - lastTime })
    lastTime = now
    requestId = requestAnimationFrame(emitTick)
  }

  return () => {
    cancelAnimationFrame(requestId)
  }
})
