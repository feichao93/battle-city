import { useEffect, useState } from 'react'

/** 挂载以来经过的毫秒数，逐帧刷新；用于非对局画面的像素动画（画廊等） */
export default function useAnimationTime(): number {
  const [time, setTime] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = requestAnimationFrame(function tick(now) {
      setTime(now - start)
      raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [])
  return time
}
